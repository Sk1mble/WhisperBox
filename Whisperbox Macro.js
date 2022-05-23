//This code works with WhisperBox. Save it as a macro to give yourself an alternative method 
//of launching a WhisperBox that will also work for players.

var users = game.users.contents;
var selectOptions = ""
users.forEach(user => selectOptions += `<option value = "${user.id}">${user.name}</option>\n`);

var dp = {
    title: "Create a WhisperBox",
    content: `Pick a user:<select id="users" name="users">${selectOptions}</select>`,
    //default:"whisper",
    buttons: {
        whisper: {
            label: "Whisper",
            callback: () => {
                let uid = document.getElementById("users").value;
                let user = game.users.find(user => user.id === uid);

                let name = user.name;
                if (game.settings.get('WhisperBox', 'showCharacterName')) {
                    name = user?.character.name ?? name;
                }

                WhisperBox.createWhisperBox({name: name, targetUser: uid});
            }
        }
    }
}
let d = new Dialog(dp);
d.render(true);