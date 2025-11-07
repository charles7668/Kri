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

type WebSocketManager struct {
	isClientConnected  bool
	clientConnectMutex sync.Mutex
}

var wsManager = WebSocketManager{
	isClientConnected:  false,
	clientConnectMutex: sync.Mutex{},
}

func echo(w http.ResponseWriter, r *http.Request) {
	wsManager.clientConnectMutex.Lock()
	if wsManager.isClientConnected {
		wsManager.clientConnectMutex.Unlock()
		http.Error(w, "A client is already connected", http.StatusConflict)
		return
	}
	wsManager.isClientConnected = true
	wsManager.clientConnectMutex.Unlock()

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		wsManager.clientConnectMutex.Lock()
		// Reset flag on upgrade error
		wsManager.isClientConnected = false
		wsManager.clientConnectMutex.Unlock()
		return
	}

	defer func() {
		wsManager.clientConnectMutex.Lock()
		wsManager.isClientConnected = false // Reset flag when connection closes
		wsManager.clientConnectMutex.Unlock()
		conn.Close()
	}()

	done := make(chan struct{})
	messageChan := make(chan []byte)

	var wg sync.WaitGroup
	wg.Add(2)

	go readPump(conn, messageChan, done, &wg)
	go writePump(conn, messageChan, done, &wg)

	wg.Wait()
}

func readPump(conn *websocket.Conn, messageChan chan<- []byte, done chan<- struct{}, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(messageChan)
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("read error:", err)
			close(done)
			return
		}
		log.Printf("Received: %s", message)
		messageChan <- message
	}
}

func writePump(conn *websocket.Conn, messageChan <-chan []byte, done <-chan struct{}, wg *sync.WaitGroup) {
	defer wg.Done()
	for {
		select {
		case message, ok := <-messageChan:
			if !ok {
				return
			}
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Println("write error:", err)
				return
			}
		case <-done:
			return
		}
	}
}

func main() {
	router := setupRouter()
	log.Fatal(router.Run(":8080"))
}

func setupRouter() *gin.Engine {
	router := gin.Default()
	router.GET("/ws", gin.WrapH(http.HandlerFunc(echo)))
	router.POST("/chat", chatHandler)
	return router
}

type ChatRequest struct {
	Message string `json:"message"`
}

func chatHandler(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": "Received your message: " + req.Message})
}
