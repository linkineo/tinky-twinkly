# Tinky-twinkly
This is an unofficial node.js sample code showing how to turn the twikly smart xmas lights ON/OFF and perform some basic light painting.
This software is not endorsed in any way by the Twinkly team and is to be used at your own risk.

### How to execute
1. Execute npm install
2. Change the IP of the device to yours in the IP variable of xmas.js (line 3)
3. Execute node xmas.js

This shall turn your lights on and paint them red :-)
To turn them off, modify line 235 to xmas(OFF).
To paint them in any color of your choosing, modify line 240 and set the RGB values accordingly.

### What it does
At the moment, you can turn ON and OFF your lights over HTTP, and paint all LEDs in a given color. 
This shall provide an easy interfacing with your home automation system. 

### Prerequisites

- Any twinkly LED set
- Knowing the IP address of your device

### Next
- LED Discovery: easy to implement, using UDP port 5555 and sending a frame with "DISCOVER" as payload.
- Movie download (needed ? Streaming in RT shall be enough)


