var $messages = $('.messages-content');
var otherResponses = ['Okay','Alright','Of Course','Ok','Sure','Absolutely','Fine'];
var genResponses = ['Good','Loved it','Amazing','Great','Very Good','Helpful','Nice','Fine enough','Interesting'];
var option_list;
var uniqueId;
var wait_flag = false;
var intent = '';
var selected_options_list = [], modal_messages = '';
var button_color, button_tooltip, button_text;
var test_report_helper, personality_helper, CII_helper, career_helper;


var checkbox = document.getElementById('checkbox-mode');
checkbox.addEventListener('change',() => {
    $(".chat-title").toggleClass("dark-chat-title");
    $(".messages").toggleClass("dark-messages");
    $(".popupButtons").toggleClass("dark-popupbuttons");
    $(".message-box").toggleClass("dark-message-box");
    $(".fa-microphone").toggleClass("dark-microphone");
});

try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
}
catch(e) {
    var err="Sorry, Your Browser Doesn't Support the Web Speech API. Try Opening This Demo In Google Chrome.";
    err.show();
}


$('#start-record-btn').on('click', function(e){
    recognition.start();
});


recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    document.getElementById("MSG").value = speechToText;
    insertMessage();
}


function listendom(no) {
    document.getElementById("MSG").value = no.innerHTML;
    insertMessage();
}


$(window).load(async function() {
    await fetch(window.location.href + 'id', {
        method: 'POST'
    }).then(res => res.json())
    .then(data => {
        uniqueId = data.sessionId;
    })
    .catch(error => console.log(error));

    $messages.mCustomScrollbar();
    const grt_msg = "Hey, I'm AmyBot. I'm your Career Counsellor. Say Hi, to start the conversation!";
    setTimeout(function() {
        serverMessage(grt_msg, 'single');
    }, 100);
});


function updateScrollbar() {
    $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
      scrollInertia: 10,
      timeout: 0
    });
  }


function insertMessage() {
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
        return false;
    }
    if (intent.includes('HidePassword')) { 
        let password = '';
        for (let i=0; i<msg.length; i++) {
            password += '&#8226;';
        }
        $(`<div class="message message-personal">${password}</div>`).appendTo($('.mCSB_container')).addClass('new');
    }
    else {
        $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    }
    $('<div class="message loading new"><div class="robot"><i class="fas fa-robot"></i></div><span></span></div>').appendTo($('.mCSB_container'));
    fetchMessage("normal",'');
    $('.message-input').val(null);
    updateScrollbar();
}


document.getElementById("mymsg").onsubmit = (e)=> {
    e.preventDefault();
    if (document.getElementById('MSG').getAttribute('type') == 'password') {
        document.getElementById('MSG').setAttribute('type', 'text');
    }
    $('#extras').empty();
    insertMessage();
}


async function serverMessage(response, type) {
    updateScrollbar();
    $('.message.loading').remove();
    
    const promise = new Promise((resolve,reject) => {
        const checkbox1 = document.getElementById('checkbox-mic');
        if (type == 'multiple') {
            $('<div class="message new"><div class="robot"><i class="fas fa-robot"></i></div>' + response + '</div>').appendTo($('.mCSB_container')).addClass('new');
            if(checkbox1.checked == true) {
                speechSynthesis.speak( new SpeechSynthesisUtterance(response) );
            }
            setTimeout(() => {
                $('<div class="message loading new"><div class="robot"><i class="fas fa-robot"></i></div><span></span></div>').appendTo($('.mCSB_container'));
                updateScrollbar();
            }, 300);
            setTimeout(function() {
                resolve('Done');
            }, 2000);
        } 
        else {
            $('<div class="message new"><div class="robot"><i class="fas fa-robot"></i></div>' + response + '</div>').appendTo($('.mCSB_container')).addClass('new');
            if(checkbox1.checked == true) {
                speechSynthesis.speak( new SpeechSynthesisUtterance(response) );
            }
            updateScrollbar();
            resolve('Done');
        }
    });
    try {
        return await promise;
    }
    catch(e) { console.log(e); }
}


function clickFunction(reply) {
    $('<div class="message message-personal">' + reply + '</div>').appendTo($('.mCSB_container')).addClass('new');
    $('<div class="message loading new"><div class="robot"><i class="fas fa-robot"></i></div><span></span></div>').appendTo($('.mCSB_container'));
    fetchMessage("button",reply);

    $('#extras').empty();
    updateScrollbar();
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


function showQuickButtons() {
    let returnedArray = shuffleArray(otherResponses);
    document.getElementById('extras').innerHTML = '<button id="button1" class="button" onclick="clickFunction(this.innerHTML)">Yes</button>&nbsp&nbsp&nbsp<button id="button2" class="button" onclick="clickFunction(this.innerHTML)">No</button>&nbsp&nbsp&nbsp<button id="button3" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[0] + '</button>&nbsp&nbsp&nbsp<button id="button4" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[1] + '</button>';
}


function showQuickButtonsNew() {
    let returnedArray = shuffleArray(genResponses);
    document.getElementById('extras').innerHTML = '<button id="button1" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[0] + '</button>&nbsp&nbsp&nbsp<button id="button2" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[1] + '</button>&nbsp&nbsp&nbsp<button id="button3" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[2] + '</button>&nbsp&nbsp&nbsp<button id="button4" class="button" onclick="clickFunction(this.innerHTML)">' + returnedArray[3] + '</button>';
}


function hidePassword() {
    document.getElementById('MSG').setAttribute('type','password');
}


function showOptionBox(list) {
    let count = 1;
    let group = document.getElementById('group');
    group.innerHTML = '';
    document.getElementById('modal-id').setAttribute("class", "modal");
    document.getElementById('contents').style.display = 'block';
    
    for(i=0; i<list.length; i++) {
        let option;
        if (list[i].includes(':')) {
            const split_list = list[i].split(':');
            option = `<input type="checkbox" name="${count}" id="${count}" value="${list[i]}" onclick="processCheckBox(${count})"/>
                        <label for="${count}" style="background-color: #e9ecef;">${split_list[1]}</label>`;
        }
        else {
            option = `<input type="checkbox" name="${count}" id="${count}" value="${list[i]}" onclick="processCheckBox(${count})"/>
                        <label for="${count}">${list[i]}</label>`;
        }
        
        group.innerHTML += option;
        count += 1;
    }
}


function closeModal() {
    document.getElementById('modal-id').setAttribute("class", "modal modal-hidden");
    document.getElementById('contents').style.display = 'none';
    document.getElementById('extras').innerHTML = `<button id="show-option-button" style="font-family: 'Montserrat';" class="btn btn-primary" onclick="showModal()">Select from our options</button>`;
}


function doneModal() {
    if (selected_options_list.length == 0) {
        document.getElementById('modal-id').setAttribute("class", "modal modal-hidden");
        document.getElementById('contents').style.display = 'none';
        document.getElementById('extras').innerHTML = `<button id="show-option-button" style="font-family: 'Montserrat';" class="btn btn-primary" onclick="showModal()">Select from our options</button>`;
    }
    else {
        if (wait_flag == true) {
            wait_flag = false;
            $('#all-chips').empty();
            $('#search').val('');
            document.getElementById('modal-id').setAttribute("class", "modal modal-hidden");
            document.getElementById('contents').style.display = 'none';
        }
        else {
            wait_flag = false;
            modal_messages += selected_options_list.join();
            
            if (modal_messages.includes(':')) {
                modal_messages = modal_messages.replace(/Weak:/g, "");
            }
            $('#all-chips').empty();
            $('#search').val('');

            document.getElementById('modal-id').setAttribute("class", "modal modal-hidden");
            document.getElementById('contents').style.display = 'none';
            $('<div class="message message-personal">' + modal_messages + '</div>').appendTo($('.mCSB_container')).addClass('new');
            $('<div class="message loading new"><div class="robot"><i class="fas fa-robot"></i></div><span></span></div>').appendTo($('.mCSB_container'));
            
            fetchMessage('button', modal_messages);
            modal_messages = '';
            selected_options_list.length = 0;
            
            $('#extras').empty();
            updateScrollbar();
        }
    }
}


function processCheckBox(name) {
    let selected_checkboxes = $('input[name="' + name + '"]:checked');
    
    if (selected_checkboxes.length > 0) {
        selected_checkboxes.each(function() {
            let value = $(this).val();
            let snackbar = document.getElementById('snackbar');
            snackbar.innerHTML = `Added "${value}"`;
            snackbar.className = "show";
            option_list.splice(option_list.indexOf(value), 1);
            setTimeout(function() {
                showOptionBox(option_list);
            }, 500);
            
            document.getElementById('all-chips').innerHTML += `<div id="single-chip" class="chip">
                                                                ${value}
                                                                <span id="chip-close${name}" class="closebtn" onclick="closeChip(this,'${value}')">&times;</span>
                                                                </div>`;
            selected_options_list.push(value);
            setTimeout(function() {
                snackbar.className = snackbar.className.replace("show", "") 
            }, 2000);
        });
    }
}


function closeChip(elem,value) {
    $(elem).parent('div').remove();
    option_list.push(value);
    option_list.sort();
    showOptionBox(option_list);
    selected_options_list.splice(selected_options_list.indexOf(value), 1);
}


$('#search').on('keyup', function() {
    let value = $(this).val();
    const returned_data = searchOptions(value,option_list);
    showOptionBox(returned_data);
})


function searchOptions(value,data) {
    let filtered_data = [];

    for (i=0; i<data.length; i++) {
        value = value.toLowerCase();
        let entity = data[i].toLowerCase();
        if (entity.includes(value)) {
            filtered_data.push(data[i]);
        }
    }
    return filtered_data;
}


function showModal() {
    showOptionBox(option_list);
}


function showData(element) {
    if (element.innerHTML == 'PT' || element.innerHTML == 'IT') {
        showPersonalityTypes(personality_helper);
    }
    else if (element.innerHTML == 'TR') {
        showTestReport(test_report_helper);
    }
    else if (element.innerHTML == 'CII') {
        CIIDescription(CII_helper);
    }
    else if (element.innerHTML == 'CD') {
        showCareerInfo(career_helper);
    }
}


function closeExtraModals(element) {
    if (wait_flag == true) {
        wait_flag = false;
        document.getElementById('new-extras').innerHTML += `<button class="btn btn-${button_color}" id="info-buttons" data-toggle="tooltip" data-placement="top" title="${button_tooltip}" onclick="showData(this);">${button_text}</button>`;
        document.getElementById('new-extras').style.display = 'table';
        $('[data-toggle="tooltip"]').tooltip();
    }
    document.getElementById(element + '-modal').className = "modal modal-hidden";
    $('.modal').css('background-color', "rgba(0, 0, 0, 0.8)");
    document.getElementsByClassName(element + '-container')[0].style.display = "none";
}


async function checkFlagStatus() {
    const check_flag_status = new Promise((resolve,reject) => {
        let interval = setInterval(() => {
            if (wait_flag == false) {
                clearInterval(interval);
                return resolve();
            }
        }, 1000);
    });
    try {
        return await check_flag_status;
    }
    catch(e) { console.log(e); }
}


async function CIIDescription(messages) {
    let cii_string = '';
    let timeout;
    const message_array = messages.split(':');
    if (message_array[1].includes('|')) {
        for (let message of message_array[1].split('|')) {
            cii_string += '<p>' + message + '</p>';
        }
    }
    else { cii_string += '<p>' + message_array[1] + '</p>'; }

    if (wait_flag == true) {
        timeout = 1500;
    }
    else { timeout = 0; }
    document.getElementById('card-modal').className = "modal";
    document.getElementById('card-spinner').style.display = 'block';
    setTimeout(() => {
        document.getElementById('card-spinner').style.display = 'none';
        $('.card-container').css({'grid-template-columns':'auto', 'display':'grid'});
        $('.modal').css('background-color', "rgba(0, 0, 0, 1)");
        const description = `<div style="grid-template-rows: 70px; grid-template-columns: 800px;" class="card"><div class="card-body">
                                <h2>Career Interest Indicator => <span style="color: red;">${message_array[0]}</span></h2>
                            </div></div>
                            <div style="grid-template-rows: 500px; grid-template-columns: 800px;" class="card">
                                <div class="card-body">${cii_string}</div>
                            </div>`;
        document.getElementsByClassName('card-container')[0].innerHTML = description;
        $('.card-body p').css('font-size', '17px');
        $('.card-body h2').css('font-size', '24px');
    }, timeout);

    try { 
        return await checkFlagStatus();
    }
    catch(e) { console.log(e); }
}


async function showCareerInfo(messages) {
    let timeout;
    if (wait_flag == true) {
        timeout = 1500;
    }
    else { timeout = 0; }
    document.getElementById('card-modal').className = "modal";
    document.getElementById('card-spinner').style.display = 'block';
    setTimeout(() => {
        document.getElementById('card-spinner').style.display = 'none';
        $('.card-container').css({'display':'grid', 'grid-template-columns':'auto auto'});
        $('.modal').css('background-color', "rgba(0, 0, 0, 1)");
        let all_careers = ``;
        for (let message of messages) {
            career_desc = ``;
            const description = message.split(':')[1];
            if (description.includes('|')) {
                for (let desc of description) {
                    career_desc += '<p id="card-info">' + desc + '</p>';
                }
            }
            else { career_desc += '<p id="card-info">' + description + '</p>'; }
            all_careers += `<div style="grid-template-columns: 500px; grid-template-rows: 200px 200px;" class="card">
                                <div class="card-body">
                                    <h2>${message.split(':')[0]}</h2>
                                    ${career_desc}
                                </div>
                            </div>`;
        }
        $('.card-body p').css('font-size', '17px');
        $('.card-body h2').css('font-size', '24px');
        document.getElementsByClassName('card-container')[0].innerHTML = all_careers;
    }, timeout);

    try {
        return await checkFlagStatus();
    }
    catch(e) { console.log(e); }
}


async function showTestReport(messages) {
    let timeout;
    if (wait_flag == true) {
        timeout = 1500;
    }
    else { timeout = 0; }
    document.getElementById('progress-modal').className = "modal";
    document.getElementById('progress-spinner').style.display = 'block';
    setTimeout(() => {
        document.getElementById('progress-spinner').style.display = 'none';
        $('.progress-container').css({'display':'block'});
        $('.modal').css('background-color', "rgba(0, 0, 0, 1)");
        let count = 1;
        let color;
        let report_results = `<h2>Test Report</h2>`;
        for (let message of messages) {
            if (count == 1 || count == 2) {
                color = 'red';
            }
            else { color = '#337ab7'; }
            report_results += `<div class="progress">
                                    <div id="trait-${count}" style="background-color: ${color}; width: ${message.split(':')[1]}%;" class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                                        ${message.split(':')[0]} ${message.split(':')[1]}%
                                    </div>
                                </div>`;
            count += 1;
        }
        document.getElementsByClassName('progress-container')[0].innerHTML = report_results;
    }, timeout);

    try {
        return await checkFlagStatus();
    }
    catch(e) { console.log(e); }
}


async function showPersonalityTypes(messages) {
    let timeout;
    if (wait_flag == true) {
        timeout = 1500;
    }
    else { timeout = 0; }
    document.getElementById('card-modal').className = "modal";
    document.getElementById('card-spinner').style.display = 'block';
    setTimeout(() => {
        document.getElementById('card-spinner').style.display = 'none';
        $('.card-container').css({'display':'grid', 'grid-template-columns':'auto auto auto', 'padding-top':'50px', 'padding-bottom':'30px'});
        $('.modal').css('background-color', "rgba(0, 0, 0, 1)");
        let personality = ``;
        for (let message of messages) {
            personality += `<div style="grid-template-columns: 265px; grid-template-rows: 145px 145px;" class="card">
                                <div class="card-body">
                                    <img src="../static/personality.png">
                                    <h2>${message.split(':')[0]}</h2>
                                    <p id="card-info">${message.split(':')[1]}</p>
                                </div>
                            </div>`;
        }
        document.getElementsByClassName('card-container')[0].innerHTML = personality;
    }, timeout);
    
    try {
        return await checkFlagStatus();
    }
    catch(e) { console.log(e); }
}


async function showPickerBox(string, end) {
    let tempList = [];
    for (let temp of string.split('|')) {
        tempList.push(temp);
    }
    option_list = tempList;
    if (end == false) {
        wait_flag = true;
    }
    else {
        wait_flag = null;
    }
    
    showOptionBox(option_list);
    try {
        return await checkFlagStatus();
    }
    catch(e) { console.log(e); }
}


function extraButtonsCheck() {
    if (intent.includes('yes')) {
        showQuickButtons();
    }
    else if (intent.includes('good')) {
        showQuickButtonsNew();
    }
}


async function arrayServerMessages(messages) {
    for (let i=0; i<messages.length; i++) {
        try {
            if (messages.length > 1) {
                if (i == messages.length-1) {
                    await serverMessage(messages[i], 'single');
                }
                else { await serverMessage(messages[i], 'multiple'); }
            } 
            else {
                await serverMessage(messages[0], 'single');
            }
        }
        catch(e) { console.log(e); }
    }
    extraButtonsCheck();
}


function fetchMessage(type, message) {
    let url = window.location.href + "send-msg";
     
    const data = new URLSearchParams();
    data.append('ID', uniqueId);
    for (const pair of new FormData(document.getElementById("mymsg"))) {
        if (type == 'button') {
            data.append(pair[0], message);
        }
        else { data.append(pair[0], pair[1]); }
    }
    
    fetch(url, {
        method: 'POST',
        body: data
    }).then(res => res.json()).then(async function(r) {
        let response = r.Reply;
        if (response.id == uniqueId) {
            intent = response.intent;
            const messages = response.message;
            
            if (intent.includes('HidePassword')) {
                hidePassword();
            }
            else if (intent.includes('Validation') && messages.length > 1) {
                test_report_helper = messages.slice(1, messages.length-2);
                button_color = 'success'; button_text = 'TR'; button_tooltip = 'Test Report';
                wait_flag = true;
                try {
                    await serverMessage(messages[0], 'single');
                    await showTestReport(test_report_helper);
                    await arrayServerMessages(messages.slice(messages.length-2, messages.length));
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if (intent.includes('PersonalityDescription') && messages.length > 1) {
                personality_helper = messages.slice(0, messages.length-2);
                button_color = 'primary'; button_text = 'PT'; button_tooltip = 'Personality Types';
                wait_flag = true;
                try {
                    await showPersonalityTypes(personality_helper);
                    await arrayServerMessages(messages.slice(messages.length-2, messages.length));
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if (intent.includes('IntelligenceDescription') && messages.length > 1) {
                personality_helper = messages.slice(3, messages.length-2);
                button_color = 'primary'; button_text = 'IT'; button_tooltip = 'Intelligence Types';
                wait_flag = true;
                try {
                    await arrayServerMessages(messages.slice(0, 3));
                    await showPersonalityTypes(personality_helper);
                    await arrayServerMessages(messages.slice(messages.length-2, messages.length));
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if (intent.includes('CareerInfo') && messages.length > 1) {
                career_helper = messages.slice(1, messages.length-1);
                button_color = 'danger'; button_text = 'CD'; button_tooltip = 'Your Career Descriptions'
                wait_flag = true;
                try {
                    await serverMessage(messages[0], 'single');
                    await showCareerInfo(career_helper);
                    await serverMessage(messages[messages.length-1], 'single');
                    extraButtonsCheck();
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if (intent.includes('CII-Description') && messages.length > 1) {
                CII_helper = messages[0];
                button_color = 'warning'; button_text = 'CII'; button_tooltip = 'Career Interest Indicator';
                wait_flag = true;
                try {
                    await CIIDescription(CII_helper);
                    await serverMessage(messages[1], 'single');
                    extraButtonsCheck();
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if ((intent.includes('CategoryPick') || intent.includes('CareerPick')) && messages.length > 1) {
                try {
                    for (let i=0; i<messages.length; i=i+3) {
                        await arrayServerMessages(messages.slice(i, i+2));
                 
                        const boxTimeout = new Promise((resolve,reject) => {
                            document.getElementById('modal-id').className = "modal";
                            document.getElementById('options-spinner').style.display = 'block';
                            setTimeout(async function() {
                                document.getElementById('options-spinner').style.display = 'none';
                                if (intent.includes('CategoryPick')) {
                                    document.getElementById('info-categories').style.display = 'block';
                                }
                                document.getElementById('contents').style.display = 'block';
                                if (i+2 == messages.length-1) {
                                    await showPickerBox(messages[i+2], true);
                                }
                                else {
                                    await showPickerBox(messages[i+2], false);
                                }
                                return resolve();
                            }, 1200);
                        });
                        await boxTimeout;
                    }
                    if (document.getElementById('info-categories').style.display == 'block') {
                        document.getElementById('info-categories').style.display = 'none';
                    }
                    extraButtonsCheck();
                    return;
                }
                catch(e) { console.log(e); }
            }
            else if (intent.includes('|')) {
                option_list = response.extras;
                document.getElementById('modal-id').className = "modal";
                document.getElementById('options-spinner').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('options-spinner').style.display = 'none';
                    document.getElementById('contents').style.display = 'block';
                    showModal();
                }, 1200);
            }

            await arrayServerMessages(messages);

        }
        else {
            console.log('Not the correct ID');
        }
    })
    .catch(error => console.error('Error h:', error));
}
