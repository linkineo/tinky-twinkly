const request = require("request");
const dgram = require('dgram');
const Color = require('color');

var IP = "192.168.0.62"; // ADD YOUR OWN LAMP IP HERE
var CHALLENGE = {'challenge':'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\a'}; // This challenge will do all the time. 
var XAUTHTOKEN = "";
var UDP_PORT_RT=7777;
var RT_BUFFER = Buffer.alloc(1+9+175*3,0);
var UDP_RT_HEADER = 0x02;
UDP_RT_HEADER[0] = UDP_RT_HEADER;
var PRODUCT_NAME="Twinkly";
var OFF = {"mode":"off"};
var ON = {"mode": "movie","code": 1000};
var RT = {"mode":"rt"};
var LAMP_STATUS = {
    UNREACHABLE: 0,
    DETECTED :1,
    CHALLENGE_ERROR: 2,
    CHALLENGE_OK: 3,
    AUTHENTICATE_ERROR: 4,
    AUTHENTICATE_OK:5,
    ACTION_ERROR: 6,
    ACTION_SUCCESS: 7
}

var gestalt = function(callback){
    request("http://" + IP + "/xled/v1/gestalt", function(error, response, body){
        if(response.statusCode == 200)
        {
            try{
                var product = JSON.parse(body);
                if(product.product_name == PRODUCT_NAME)
                {   
                    callback(LAMP_STATUS.DETECTED);
                }else
                {
                    callback(LAMP_STATUS.UNREACHABLE);
                }
            }catch(error)
            {
                callback(LAMP_STATUS.UNREACHABLE);
            }
        }else{
            callback(LAMP_STATUS.UNREACHABLE);
        }
    })
}

var login = function(callback){
    var options = {
        method: "POST",
        uri: "http://" + IP + "/xled/v1/login",
        json: true,
        body: CHALLENGE,
        headers: {
            "Content-Length" : JSON.stringify(CHALLENGE).length
        }
      };

      request(options,function(error,response,body){
      
        if(response.statusCode == 200)
        {
            try{
                XAUTHTOKEN = body.authentication_token;
                callback(LAMP_STATUS.CHALLENGE_OK)
               
            }catch(error)
            {
                callback(LAMP_STATUS.CHALLENGE_ERROR);
            }
        }else{
            callback(LAMP_STATUS.UNREACHABLE);
        }
      })
}


var verify = function(callback){
    var options = {
        method: "POST",
        uri: "http://" + IP + "/xled/v1/verify",
        json: true,
        body: {},
        headers: {
            "X-Auth-Token" : XAUTHTOKEN,
            "Content-Length" : 2
        }
      };

      request(options,function(error,response,body){
       
        if(response.statusCode == 200)
        {
            try{
               if(body.code == 1000)
               {
                callback(LAMP_STATUS.AUTHENTICATE_OK)
               }else
               {
                callback(LAMP_STATUS.AUTHENTICATE_ERROR)
               }                
               
            }catch(error)
            {
                callback(LAMP_STATUS.AUTHENTICATE_ERROR);
            }
        }else{
            callback(LAMP_STATUS.UNREACHABLE);
        }
      })
}

var action = function(mode,callback){
    var options = {
        method: "POST",
        uri: "http://" + IP + "/xled/v1/led/mode",
        json: true,
        body: mode,
        headers: {
            "X-Auth-Token" : XAUTHTOKEN,
            "Content-Length" : JSON.stringify(mode).length
        }
      };

      request(options,function(error,response,body){
       
        if(response.statusCode == 200)
        {
            try{
               if(body.code == 1000)
               {
                callback(LAMP_STATUS.ACTION_SUCCESS)
               }else
               {
                callback(LAMP_STATUS.ACTION_ERROR)
               }                
               
            }catch(error)
            {
                callback(LAMP_STATUS.ACTION_ERROR);
            }
        }else{
            callback(LAMP_STATUS.UNREACHABLE);
        }
      })
}



var connect = function(callback){

    gestalt(function(status){
        if(status == LAMP_STATUS.DETECTED)
        {
            login(function(status){
                if(status == LAMP_STATUS.CHALLENGE_OK)
                {
                    verify(function(status){
                        if(status == LAMP_STATUS.AUTHENTICATE_OK)
                        {
                            callback(status);
                        }else
                        {
                            console.log("ERROR CODE=" + status);
                        }
                    })
                }else
                {
                    console.log("ERROR CODE=" + status);
                }
            })
        }else
        {
            console.log("ERROR CODE=" + status);
        }
    })
}


var paint_single_color = function(color_value)
{
    var udp_token = Buffer.from(XAUTHTOKEN,"base64");
    udp_token.copy(RT_BUFFER,1,0,udp_token.length);

    var color_buffer=Buffer.alloc(3);
    color_buffer[0] = color_value.red();
    color_buffer[1] = color_value.green();
    color_buffer[2] = color_value.blue();
    RT_BUFFER.fill(color_buffer,10,RT_BUFFER.length);
  
    var client = dgram.createSocket('udp4');
    client.send(RT_BUFFER, UDP_PORT_RT, IP, (err) => {
        client.close();
    });
      
}


var xmas_paint = function(color_value)
{
    connect(function(status) {
        if(status == LAMP_STATUS.AUTHENTICATE_OK)
        {
            action(RT, function(status){
                if(status == LAMP_STATUS.ACTION_SUCCESS)
                {
                   paint_single_color(color_value);
                }
            })
        }
       })
}

var xmas = function(mode)
{
    connect(function(status) {
     if(status == LAMP_STATUS.AUTHENTICATE_OK)
     {
         action(mode, function(status){
             if(status == LAMP_STATUS.ACTION_SUCCESS)
             {
                console.log("SUCCESSFUL MODE CHANGE");
             }
         })
     }
    })
}

//TURN THE LAMPS ON
//xmas(ON); 

//TURN THE LAMPS OFF
//xmas(OFF);

//TURN ON AND PAINT A COLOR (The LEDs will automatically revert to their normal ON mode (movie) after a few seconds)
xmas_paint(Color("red"));
//TURN ON AND PAINT ANY RGB COLOR
//xmas_paint(Color.rgb(118,36,242));



