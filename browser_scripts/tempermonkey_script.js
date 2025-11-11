// ==UserScript==
// @name         Kri-Ext
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Kri extension scripts
// @author       Charles
// @match        https://gemini.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// @require      https://unpkg.com/turndown/dist/turndown.js
// @run-at       document-idle
// ==/UserScript==

/**
 * Before using this script, you must disable the browser's Content Security Policy (CSP)
 * through your Tampermonkey settings.
 * * Instructions:
 * 1. Go to the Tampermonkey settings page.
 * 2. Change setting mode to "Advance".
 * 3. Scroll down to the "Security" section.
 * 4. Set the option "Modify existing content security policy (CSP) headers" to "Yes".
 */

(function () {
    'use strict';

    function htmlToMarkdown(html) {
        let turndownService = new TurndownService();
        // add <sup> tag conversion rule
        turndownService.addRule("superscript", {
            filter: "sup",
            replacement: function (content) {
                return "<sup>" + content + "</sup>";
            }
        });

        // add <sup> tag conversion rule
        turndownService.addRule("subscript", {
            filter: "sub",
            replacement: function (content) {
                return "<sub>" + content + "</sub>";
            }
        });

        // convert pre formatted text to code block
        turndownService.addRule("prescript", {
            filter: "pre",
            replacement: function (content, node, options) {
                return "```" + "\n" + node.innerText + "\n" + "```";
            }
        });

        // convert <code> tag
        turndownService.addRule("customCode", {
            filter: "code",
            replacement: function (content, node, options) {
                let hasSiblings = node.childNodes.length > 1;
                if (hasSiblings) {
                    return "<code>" + content + "</code>";
                } else {
                    return "`" + content + "`";
                }
            }
        });

        turndownService.addRule('b', {
            filter: "b",
            replacement: function (content, node, options) {
                return "**" + content + "**";
            }
        })

        turndownService.addRule('hr', {
            filter: "hr",
            replacement: function (content, node, options) {
                return "---";
            }
        })

        let markdown = turndownService.turndown(html);

        return markdown;
    }

    // Create the button element
    const myButton = document.createElement('button');
    myButton.innerText = 'Kri';

    // Style the button
    myButton.style.position = 'fixed';
    myButton.style.right = '0';
    myButton.style.top = '50%';
    myButton.style.transform = 'translateY(-50%)';
    myButton.style.zIndex = '9999';
    myButton.style.padding = '10px';
    myButton.style.backgroundColor = '#007bff';
    myButton.style.color = 'white';
    myButton.style.border = 'none';
    myButton.style.cursor = 'pointer';
    myButton.style.borderRadius = '5px 0 0 5px';

    let isConnected = false;
    let ws;
    let receiveLock = false;

    // Add a click event listener
    myButton.addEventListener('click', mouseEvent => {
        if (isConnected) {
            ws.close();
            isConnected = false;
            return;
        }
        console.log('try connect to Kri');
        ws = new WebSocket('ws://127.0.0.1:8080/ws');

        ws.onopen = () => {
            console.log('WebSocket connection opened.');
        };

        ws.onmessage = async (event) => {
            if (receiveLock) {
                console.log('other message is processing');
                return;
            }
            receiveLock = true;
            console.log('WebSocket message received:', event.data);
            let textarea = document.querySelector('.textarea');
            textarea.innerHTML = '<p>' + event.data + '</p>';
            let waitInterval;
            setTimeout(() => {
                let sendBtn = document.querySelector('button.send-button');
                sendBtn.click();
                waitInterval = setInterval(() => {
                    let avatarIcons = document.querySelectorAll('.avatar_primary_animation.is-gpi-avatar.aurora-enabled');
                    let avatar = avatarIcons[avatarIcons.length - 1];
                    let attr = avatar.getAttribute('data-test-lottie-animation-status')
                    if (attr === 'completed') {
                        clearInterval(waitInterval);
                        let responses = document.querySelectorAll('message-content.model-response-text');
                        let response = responses[responses.length - 1].querySelector('div');
                        let children = response.children;
                        let responseText = '';
                        for (let i = 0; i < children.length; i++) {
                            if (children[i].nodeName.toLowerCase() === 'hr') {
                                responseText += '---';
                            } else {
                                responseText += htmlToMarkdown(children[i].innerHTML);
                            }
                            responseText += '\n';
                        }
                        console.log(responseText);
                        ws.send(responseText);
                        receiveLock = false;
                    }
                }, 100)
            }, 100)
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            alert('failed to connect to Kri with websocket connection.');
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
        };
        isConnected = true;
    });

    document.body.appendChild(myButton);
})();
