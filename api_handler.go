package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	// WsManagerKey is the key used to store the WebSocketManager in the Gin context.
	WsManagerKey = "wsManager"
)

type ChatRequest struct {
	Message string `json:"message"`
}

// ChatHandler handles incoming chat messages and sends them to the WebSocket.
func ChatHandler(c *gin.Context) {
	// Retrieve the WebSocketManager from the context
	wsManager, exists := c.Get(WsManagerKey)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "WebSocketManager not found in context"})
		return
	}
	manager, ok := wsManager.(*WebSocketManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "WebSocketManager is of incorrect type"})
		return
	}

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	manager.clientConnectMutex.Lock()
	if !manager.isClientConnected {
		manager.clientConnectMutex.Unlock()
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "No websocket client connected"})
		return
	}
	manager.clientConnectMutex.Unlock()

	manager.messageChanMutex.Lock()
	if manager.messageChan == nil {
		manager.messageChanMutex.Unlock()
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Websocket message channel not initialized"})
		return
	}
	manager.messageChan <- []byte(req.Message)
	manager.messageChanMutex.Unlock()

	response := <-manager.receiveChan

	c.JSON(http.StatusOK, gin.H{"response": string(response)})
}
