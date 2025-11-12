// ==UserScript==
// @name         Kri-Ext
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Kri extension scripts
// @author       Charles
// @match        https://gemini.google.com/*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAT2SURBVFiFtZdbbFRVFIb/vefWGTsttaVIC0kFKxYrVwWDGFMeTK0Q3kpN5EVjNEJENFHAgBKvxMuLMQYj+uCLmkh4gAheIGJFgtDQi0ZJCQXLUGAQGObSmXPO+n2YS3vm0jOpsl9m9j6T9f17nX+tvUehzDHre1Z73NZK0mwjOQ9gE4VTSAGF10AZItgrwkMexb2DHbWRcuIqpx+0/sQWk/ISKWtI8ZMEKCCJDNw+T38mFOVLg9aO0OrGvyYlYPFxBuIxeYvEOlLc2eBlwIGxuUmRD5XJV4Y7ZybKFjCnmw3K4h6Q96UDTQqengtBykmIuTrUOfuco4CWw1wEci/J6f8TPDsPabFWhbqae0oKmHeIMwzNYzcBnn1+2YK5PNzVcirL1NkvM47Qb2h+cxPhIGUqRO9u2Hk8UCAgaMjbJJfcRHgmpnV30u/fYnsFmVLrK+X2NQ1uPDbTAxAgiGd+GcGw+HLB2+q9ePGuynREAicuRbH5twtQXr8NPk5gXBlGc/jJRSE3AJgiLxOlS62hQqG1ypXzSkX8CsS6BcpfiVqvwnsLp2CqL53MpEWs39MPc+QqXI2zAa+vWHYC4tKvAnha33GUVYR0OqXd5lyXBxKLgKkk3l9YnYMDwLbuQfxxPgyKBTN0GjKaKPVqHq/b1R3UroS1yqnDAXYBcLkBjw9PNAexYlpFbvng+Qg++7kPVACUAoWwLp0FMyLyfBEwlL9DZ3r7xIbLbxZuL+6sr8bm1prcUnjUwvrdRyBZOBSoFSCEFQ5BUqMFphVaK7QI5zu5HXmvwOfz4KP7p6HCpbK+w4YD/bgYidngCgoE0rB/RgAjmZ+J+VqBTY6llpeDTffUYW61JzffNTCC/QOni8OVzrU761oYNFJjGxO5XZOscq5zu4AH6322+adH/5wYrjJzABK9CppGmiWs1uU0mfxxImw/2N59dDGU0hPDVbpSSIDxCGiaIAWawohzh7NnYOt3vTgbNcYyMj2Ip5a3OsOVAlRahIzGQMu6rkE549he8wTEDQPP7++1OeO1ZbMx57YaZzjGXgdSo0OaYK9Tb883IQEcPnUOn/8+klvzuRQ+XnkvPC7tDFcKCoAo1adFeMj5YCmwAQiFrQeO40wkmVtbUBfAc8vnlgWnUlBu/qA9intJiU90qhV0wozbEykLz37bm05SZmxa0oQFjVMd4QTiCe3dpwc7aiOK8pXTkWrbvULOcL8OXcQn/aHcM49W2PnIPPi87ongIPAF1rVF3QBg0NqhqdaS4i4GH44m0XslW3rEjaRpc/v2g31orgmg1p9pTiQeaqrH/sGR4nCFmIvcns5lZjTuHv4A5MaihhQL5uVhSPxG+aVWaucKoFKvpzY8vA0YdyPyXDe2CORY0ZsMAF07Hdof/O9wqIFURfKdMTeNGzO+/rvRhHEMZEOJmwysq5fA0dik4IC6DJFlyRfaB7NMPV7AcOfM81qsVaSES5lSVd0KVAQmBRdK+3h4gQAACHU191gwHyA5ULQiAKhgDeALlJ92qn6ILDM2tvfk8woEAEC4q+WU50Z0KS2+SUq8WKNCoBL0+pzgMUK/kWLl0vydZ4fjn9O6XT0NltbbAK4lJWC/qAgkHgMto6DJEPjCBW6Pb2y/MFF8RwFjQrqDhvJ3CK0VIOdDZBaF1aSAycR10BoSqpPKgx8T2rsP69qi5cT9F4PMRDGe2qO9AAAAAElFTkSuQmCC
// @grant        none
// @require      https://unpkg.com/turndown/dist/turndown.js
// @run-at       document-idle
// ==/UserScript==

// icon is from https://www.flaticon.com/free-icon

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

    let setConnectState = (state) => {
        isConnected = state;
        if (state) {
            myButton.style.backgroundColor = 'green';
        } else {
            myButton.style.backgroundColor = '#007bff';
        }
    }

    let isConnected = false;
    let ws;
    let receiveLock = false;

    // Add a click event listener
    myButton.addEventListener('click', mouseEvent => {
        if (isConnected) {
            ws.close();
            setConnectState(false);
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
            setConnectState(false);
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            setConnectState(false);
        };
        setConnectState(true);
    });

    document.body.appendChild(myButton);
})();
