var request = require("request");

var IP = "192.168.0.62"; // ADD YOUR OWN LAMP IP HERE
var CHALLENGE = {'challenge':'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\a'}; // This challenge will do all the time. 
var XAUTHTOKEN = "";
var PRODUCT_NAME="Twinkly";
var OFF = {"mode":"off"};
var ON = {"mode": "movie","code": 1000};
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
xmas(ON);
// xmas(OFF) to turn the lamps OFF...


