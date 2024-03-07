// Constants to easily refer to pages
const HOME = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const CHANNELS = document.querySelector(".channels");
const THREADS = document.querySelector(".threads");

window.addEventListener("DOMContentLoaded", ()=>{
    loadEventListeners();
    sessionStorage.setItem("message_id", "0")
    sessionStorage.setItem("channel_name", "")
    sessionStorage.setItem("channel_id", "0")
    navigateTo(window.location.pathname);
})

window.addEventListener("popstate", () => {
    // clear the history on popstate events
    window.history.go(-(window.history.length - 1));
    console.log("popstate, delete history")
    navigateTo(window.location.pathname) }
); 

function navigateTo(path) {
    // add path to the history
    console.log("asked to go to ", path)
    history.pushState({}, "", path)
    // get credentials to see if user is logged in
    const user_api_key = sessionStorage.getItem("swalker10_auth_key")
    const logged_in = (user_api_key != null)
    
    if (logged_in && path=="/") {
        history.pushState({}, "", "/channels")
        router("/channels")
    }

    else if (logged_in && path=="/login") {
        history.pushState({}, "", "/channels")
        router("/channels")
    }

    else if (!logged_in && path=="/") {
        router("/")
    }

    else if (!logged_in && path!="/") {
        // history.pushState({}, "", "/login")
        router("/login")
    }

    else {
        router(path)
    }
}

// On page load, show the appropriate page and hide the others
let showOnly = (element) => {
    HOME.classList.add("hide")
    LOGIN.classList.add("hide")
    PROFILE.classList.add("hide")
    CHANNELS.classList.add("hide")
    THREADS.classList.add("hide")
  
    element.classList.remove("hide");
}


// direct system which page to display based on url path
function router(path) {
    const path_list = path.split("/")
    // home page
    if (path_list[1] == "") {
      showOnly(HOME);
    } 
    // login page
    else if (path_list[1] == "login") { 
        document.querySelector(".message").classList.add("hide")
        document.querySelector("#login-username").value = ""
        document.querySelector("#login-pw").value = ""
        showOnly(LOGIN);
    }
    // profile page
    else if (path_list[1] == "profile") { 
        document.querySelector("#profile-username").textContent = sessionStorage.getItem("user_name");
        document.querySelector("#name-set").value = "";
        document.querySelector("#pw-set").value = "";
        showOnly(PROFILE);
    }
    // channel page
    else if (path_list[1] == "channels") { 
        console.log(sessionStorage.getItem("user_name"))
        document.querySelector("#two-username").textContent = sessionStorage.getItem("user_name")
        showOnly(CHANNELS); 
        pollForChannels();
        pollForMessages();
    }
    // open threads page
    else if (path_list[1] == "threads") { 
        document.querySelector("#three-username").textContent= sessionStorage.getItem("user_name")
        showOnly(THREADS); 
        pollForChannels();
        pollForMessages();
    } 
    // page not found
    else {
      // show a 404
      console.log("404")
    } 
}

function loadEventListeners() {
    // "/" page:
    // 1. add event listener to log-in icon
    console.log("event listeners loaded")
    document.querySelector(".login-button").addEventListener("click", (event) =>{navigateTo("/login")}) 
    // 2. add event listener to sign-up icon
    document.querySelector(".signup").addEventListener("click", (event) =>{homeSignUp(event)}) 
    
    // "channels" page:
    // 1. edit profile button
    document.querySelector("#profile-button1").addEventListener("click", (event) =>{
        navigateTo("/profile")})
    // 2. when people click the + button to create a new channel
    document.querySelector("#create-channel1").addEventListener("click", (event) => {
        document.querySelector("#un-hide1").classList.remove("hide")
    })
    // 3. after people click the "create channel" button to save new channel
    document.querySelector("#hit-enter1").addEventListener("click", (event) => {
        event.preventDefault();
        channel_name = document.querySelector("#channel-set1").value;
        createNewChannel(channel_name, "two");
        document.querySelector("#un-hide1").classList.add("hide")
    })

    // "threads" page:
    // 1. edit profile button
    document.querySelector("#profile-button2").addEventListener("click", (event) =>{
        navigateTo("/profile")})

    // "profile" page:
    // 1. log-out button
    document.querySelector("#log-out").addEventListener("click", (event) =>{
        sessionStorage.clear();
        navigateTo("/")})
    // 2. return-to-channels button
    document.querySelector("#go-back").addEventListener("click", (event) =>{
        document.querySelector("#pw-set").value = "";
        document.querySelector("#name-set").value = "";
        history.back()})
    // 3. update name button
    document.querySelector("#updateUser").addEventListener("click", (event) =>{
        console.log("update user triggered")
        updateUsername(event)})
    // 4. update password button 
    document.querySelector("#updatePassword").addEventListener("click", (event) =>{updatePassword(event)})

    // "login" page:
    // 1. log-in button
    document.querySelector(".go-button").addEventListener("click", (event) =>{logIn(event)}) 
    // 2. signup button
    document.querySelector(".new").addEventListener("click", (event) =>{loginSignUp(event)}) 


}



function updateUsername(event) {
    event.preventDefault();
    new_username = document.querySelector("#name-set").value;
    console.log("profile page new = ", new_username);
    fetch(`/api/profile`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json", 
    "auth-key": sessionStorage.getItem("swalker10_auth_key"),
    "username": new_username,
    "update-type": "username",
    },
    }).then(response => { if (response.status == 200) {
    // update the sessionStorage with new credentials
    console.log("your username has been updated")
    sessionStorage.setItem("user_name", new_username)
    document.querySelector("#profile-username").textContent = sessionStorage.getItem("user_name")
    }
    else {console.log("not valid")}})
}


function updatePassword(event) {
    event.preventDefault();
    new_pw = document.querySelector("#pw-set").value;
    console.log(new_pw);
    
    fetch(`/api/profile`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json", 
    "auth-key": sessionStorage.getItem("swalker10_auth_key"),
    "username": sessionStorage.getItem("user_name"),
    "new-pw": new_pw,
    "update-type": "password",
    },
    }).then(response => { if (response.status == 200) {
    console.log("your password has been updated")
    }
    else {console.log("not valid")}})
}



function logIn(event) {
    event.preventDefault();
    username = document.querySelector("#login-username").value
    pw = document.querySelector("#login-pw").value
    console.log(pw, username, "login inputs")
    //send request to app.py to verify if valid user
    fetch(`/api/login`, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        "password": pw,
        "username": username,
        },
        }).then(response => response.json())
        .then(info => {
        console.log(info)
        info.forEach(item => {
            // response will have their user_id and api_key
            const user_id = item.user_id
            const user_api_key = item.user_api_key
            //if their log-in is invalid, api-key will be null
            //and display error message
            if (user_api_key == null) {
            document.querySelector(".message").classList.remove("hide")
            }
            // otherwise, save their apikey in sessionStorage and redirect to "/"
            //page (they will be logged in)
            else {
            sessionStorage.setItem("swalker10_auth_key", user_api_key);
            sessionStorage.setItem("user_id", user_id);
            sessionStorage.setItem("user_name", username);
            history.back()
            }
        })})
}


function homeSignUp(event) {
    event.preventDefault();
    console.log("signing in");
    fetch(`/api/`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    }).then(response => response.json())
    .then(info => {
        sessionStorage.setItem("swalker10_auth_key", info[0].user_api);
        sessionStorage.setItem("user_name", info[0].user_name);
        sessionStorage.setItem("user_id", info[0].user_id);
        console.log(sessionStorage.getItem("user_name"))
        navigateTo("/channels");
    })
}

function loginSignUp(event) {
    event.preventDefault();
    console.log("signing in");
    fetch(`/api/login`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    }).then(response => response.json())
    .then(info => {
        sessionStorage.setItem("swalker10_auth_key", info[0].user_api);
        sessionStorage.setItem("user_name", info[0].user_name);
        sessionStorage.setItem("user_id", info[0].user_id);
        console.log(sessionStorage.getItem("user_name"))
        navigateTo("/channels");
    })
}
  


// create the left-hand column which displays the list of channels
function buildChannels(url) {
    if (url=="channels")  {
        fetch(`/api/channels`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "user-id": sessionStorage.getItem("user_id"),
            "get-type": "list-channels"
        },
        }).then(response => response.json())
        .then(info => {
        let block = document.querySelector("#channels-2col");
        block.innerHTML = "";
        if (info[0] == "no channels") {
            return
        }
        else { 
            info.forEach(item => {
                const channel_name = item.channel_name
                const channel_id = item.channel_id
                
                const div = document.createElement("div");
                if (channel_id == sessionStorage.getItem("channel_id")) {
                    div.setAttribute("id", "selected")
                }
                div.addEventListener("click", (event) => {
                    event.preventDefault();
                    sessionStorage.setItem("channel_id", channel_id);
                    sessionStorage.setItem("channel_name", channel_name);
                })
                div.classList.add("channel-option")
                div.setAttribute("number", channel_id)
                const name = document.createElement("name");
                name.innerHTML = channel_name;
                const space = document.createElement("br");
                // ADD UNREAD

                div.appendChild(name);
                div.appendChild(space);
                block.appendChild(div);
                
            })}})   
    } 
    
    
    if (url=="threads")  {
        fetch(`/api/threads`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "user-id": sessionStorage.getItem("user_id"),
            "get-type": "list-channels"
        },
        }).then(response => response.json())
        .then(info => {
        let block = document.querySelector("#channels-3col");
        block.innerHTML = "";
        if (info[0] == "no channels") {
            return
        }
        else { 
            info.forEach(item => {
                const channel_name = item.channel_name
                const channel_id = item.channel_id
                
                const div = document.createElement("div");
                if (channel_id == sessionStorage.getItem("channel_id")) {
                    div.setAttribute("id", "selected")
                }
                div.addEventListener("click", (event) => {
                    event.preventDefault();
                    sessionStorage.setItem("channel_id", channel_id);
                    sessionStorage.setItem("channel_name", channel_name);
                })
                div.classList.add("channel-option")
                div.setAttribute("number", channel_id)
                const name = document.createElement("name");
                name.innerHTML = channel_name;
                const space = document.createElement("br");
                // ADD UNREAD

                div.appendChild(name);
                div.appendChild(space);
                block.appendChild(div);
                
            })}})   
    }     
}


function createNewChannel(channel_name, page) {
    if (page == "two") {
        fetch(`/api/channels`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "new-name": channel_name
            },
            }).then(response => { if (response.status == 200) {
            console.log("your channel has been saved")
            }
            else {console.log("not valid")}})
    }

    if (page == "three") {
        fetch(`/api/threads`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            "new-name": channel_name
            },
            }).then(response => { if (response.status == 200) {
            console.log("your channel has been saved")
            }
            else {console.log("not valid")}})
    }

}





function pollForChannels() {
    let intervalId = setInterval(() => {
        if (window.location.pathname.split('/')[1] == "channels") {
            buildChannels("channels");
        } 
        else if (window.location.pathname.split('/')[1] == "threads") {
            buildChannels("threads");
        } 
        else {
          clearInterval(intervalId);
          return;
        }
      }, 1000);
}

function pollForMessages() {
    let intervalId2 = setInterval(() => {
        if (window.location.pathname.split('/')[1] === "channels" || window.location.pathname.split('/')[1] === "threads") {  
            if (sessionStorage.getItem("channel_id") != "0") {
                document.querySelector("#name-2col").innerHTML = sessionStorage.getItem("channel_name")
                document.querySelector("#name-3col").innerHTML = sessionStorage.getItem("channel_name")
                // buildMessages(window.location.pathname.split('/')[1]);
            } }
        else {
          clearInterval(intervalId2);
          return;
        }
      }, 1000);
}