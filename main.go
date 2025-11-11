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
	messageChan        chan []byte
	messageChanMutex   sync.Mutex
	receiveChan        chan []byte
}

var WsManager = WebSocketManager{
	isClientConnected:  false,
	clientConnectMutex: sync.Mutex{},
}

func connectWS(w http.ResponseWriter, r *http.Request) {
	WsManager.clientConnectMutex.Lock()
	if WsManager.isClientConnected {
		WsManager.clientConnectMutex.Unlock()
		http.Error(w, "A client is already connected", http.StatusConflict)
		return
	}
	WsManager.isClientConnected = true
	WsManager.clientConnectMutex.Unlock()

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		WsManager.clientConnectMutex.Lock()
		// Reset flag on upgrade error
		WsManager.isClientConnected = false
		WsManager.clientConnectMutex.Unlock()
		return
	}

	WsManager.messageChanMutex.Lock()
	WsManager.messageChan = make(chan []byte)
	WsManager.receiveChan = make(chan []byte)
	WsManager.messageChanMutex.Unlock()

	defer func() {
		WsManager.clientConnectMutex.Lock()
		WsManager.isClientConnected = false // Reset flag when connection closes
		WsManager.clientConnectMutex.Unlock()

		WsManager.messageChanMutex.Lock()
		close(WsManager.messageChan)
		WsManager.messageChan = nil // Clear the channel
		WsManager.messageChanMutex.Unlock()

		conn.Close()
	}()

	done := make(chan struct{})

	var wg sync.WaitGroup
	wg.Add(2)

	go readPump(conn, WsManager.receiveChan, done, &wg)
	go writePump(conn, WsManager.messageChan, done, &wg)

	wg.Wait()
}

func readPump(conn *websocket.Conn, messageChan chan []byte, done chan<- struct{}, wg *sync.WaitGroup) {
	defer wg.Done()
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
		case message := <-messageChan:
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

// PrepareWSManager injects the WsManager into the Gin context.
func PrepareWSManager(wsManager *WebSocketManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(WsManagerKey, wsManager)
		c.Next()
	}
}

func main() {
	router := setupRouter()
	log.Fatal(router.Run(":8080"))
}

func setupRouter() *gin.Engine {
	router := gin.Default()
	router.GET("/ws", gin.WrapH(http.HandlerFunc(connectWS)))
	router.POST("/chat", PrepareWSManager(&WsManager), ChatHandler)
	return router
}
