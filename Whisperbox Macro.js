//This code works with WhisperBox. Save it as a macro to give yourself an alternative method 
//of launching a WhisperBox that will also work for players.

var users = game.users.entries;
var selectOptions = ""
users.forEach(user => selectOptions+=`<option value = "${user.id}">${user.name}</option>\n`);
console.log(selectOptions);
var dp = {
    title:"Create a WhisperBox",
    content:`Pick a user:<select id="users" name="users">${selectOptions}</select>`,
    //default:"whisper",
    buttons:{
        whisper:{   
                    label:"Whisper", callback:() => {
                        let uid=document.getElementById("users").value;
                        console.log(uid);
                        let user = game.users.find(user => user.id===uid);
                        let name = user.name;
                        let opt = Dialog.defaultOptions;
                        opt.resizable=false;
                        opt.title=`Whispering to ${name}`;
                        opt.width=400;
                        opt.height=400;
                        opt.minimizable=true;
                        opt.resizable=true;
                        var target=uid;
                        var whisperbox = new WhisperBox (opt, data, target);
                        whisperbox.render(true);
                        whisperbox.getHistory();
                        var data = user;
                        Hooks.on('renderChatMessage', function(html, data){
                            whisperbox.getHistory();
                    });
            }}
        }
    }
    let d = new Dialog(dp);
    d.render(true);