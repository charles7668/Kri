package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	isClientConnected  bool
	clientConnectMutex sync.Mutex
)

func echo(w http.ResponseWriter, r *http.Request) {
	clientConnectMutex.Lock()
	if isClientConnected {
		clientConnectMutex.Unlock()
		http.Error(w, "A client is already connected", http.StatusConflict)
		return
	}
	isClientConnected = true
	clientConnectMutex.Unlock()

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		clientConnectMutex.Lock()
		// Reset flag on upgrade error
		isClientConnected = false
		clientConnectMutex.Unlock()
		return
	}

	defer func() {
		clientConnectMutex.Lock()
		isClientConnected = false // Reset flag when connection closes
		clientConnectMutex.Unlock()
		conn.Close()
	}()

	var wg sync.WaitGroup
	done := make(chan struct{})
	messageChan := make(chan []byte)

	// Reader goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		// Close messageChan when reader exits
		defer close(messageChan)
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Println("read error:", err)
				// Signal writer to exit
				close(done)
				return
			}
			log.Printf("Received: %s", message)
			messageChan <- message
		}
	}()

	// Writer goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			select {
			case message, ok := <-messageChan:
				// messageChan was closed by reader
				if !ok {
					return
				}
				err := conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					log.Println("write error:", err)
					return
				}
			case <-done: // Reader signaled to exit
				return
			}
		}
	}()

	// Wait for both goroutines to finish
	wg.Wait()
}

func main() {
	router := gin.Default()
	router.GET("/ws", gin.WrapH(http.HandlerFunc(echo)))
	log.Fatal(router.Run(":8080"))
}
