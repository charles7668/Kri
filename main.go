package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func echo(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		log.Printf("Received: %s", message)
		err = conn.WriteMessage(messageType, message)
		if err != nil {
			log.Println(err)
			return
		}
	}
}

func main() {
	http.HandleFunc("/ws", echo)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
