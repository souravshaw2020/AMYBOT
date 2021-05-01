'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { WebhookClient } = require('dialogflow-fulfillment');
const serviceAccount = require('./service-account.json');

//--------------------------------------------------------------------------------------------------------------------------------------------------------
var nameOfStudent,studentClass,dominantTraitOne,dominantTraitTwo,dominantTraitThree,profiling_type,careerInterestIndicator,weakSubjects,studentCategories;
var futureCareers = [], personality_dict = {};
//--------------------------------------------------------------------------------------------------------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chatbotspardha-qvdowa.firebaseio.com/'
});

process.env.DEBUG = 'dialogflow:debug';


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }


  function passwordHandler(agent) {
    const username = agent.context.get('username').parameters;

    const getTrimmedPassword = (password) => {
      const indexesToSkip = [0, password.length-1];
      let trimmedPassword = ``;
      for(let i=0; i<password.length; i++) {
        if (indexesToSkip.includes(i)) {
          trimmedPassword += password[i];
        }
        else {
          trimmedPassword += '&#8226;';
        }
      }
      return trimmedPassword;
    }
    
    try {
      const password = getTrimmedPassword(agent.parameters.password);
      agent.add(`Great! Correct me if I am wrong.`);
      agent.add(`Username => ${username.username}<br>Password (hidden) => ${password}`);
      agent.add(`Am I correct?`);
    }
    catch (error) {
      agent.add(`I'm sorry, seems like we ran into in error.`);
    }
  }
  

  async function validationHandler(agent) {
    const axios = await require('axios');
    const usernameParams = agent.context.get('username').parameters;
    const passwordParams = agent.context.get('password').parameters;
    let token, all_traits;
    
    const APICallOne = async() => {
      const result = await axios({method: 'post', responseType: 'json',
       	url: 'http://stg.studentconnect.in/api/validate/user',
        data: {email: usernameParams.username, password: passwordParams.password}
      })
      .then(snapshot => { return snapshot; }).catch(error => { return error.response; });
      
      token = result.data.access_token;
      if(result.data.success == true) {
        return `Perfect! Your details are correct.`;
      }
      else if(result.data.message.password[0] == 'The password must be at least 6 characters.') {
        return `It seems the password that you gave me is incorrect. Please type in the correct password.`;
      }
      else {
        return `Are you sure you've have given me the right details? Shall I try again?`;
      }
    };
 	  const APICallTwo = async () => {
      const result = await axios({method: 'post', responseType: 'json',
        url: 'http://stg.studentconnect.in/api/score/calculation',
        data: {
          user_id: usernameParams.username
        },
        headers: { Authorization: `Bearer ${token}` }
      }).then(snapshot => { return snapshot; }).catch(error => { return error.response; });
      
      all_traits = (result.data.response).slice(0);
      all_traits.sort(function(a,b) { return b.score - a.score });
      nameOfStudent = result.data.username.first;
      
      dominantTraitOne = all_traits[0].category_name;
      dominantTraitTwo = all_traits[1].category_name;
      dominantTraitThree = all_traits[2].category_name;
      if (result.data.status == 'success') {
        return `So how did you find the overall experience of the test ${nameOfStudent}?`;
      } 
      else {
        return `Looks like you exist in our records but you haven't appeared for the test. I suggest you could first appear for the test and then come back later.`;
      }
    };
    
    try {
      const responseOne = await APICallOne();
      const responseTwo = await APICallTwo();
      agent.add(responseOne);
      for (let i = 0; i < all_traits.length; i++) {
        agent.add(`${all_traits[i].category_name}:${all_traits[i].score}`);
      }
      agent.add(`<b>A button has been added to the left of the chatbox. Hover over the button to see what it shows on click!</b>`);
      agent.add(responseTwo);
    } 
    catch (error) {
      agent.add(`Sorry. It seems we encountered an error.`);
    }
    
    if((usernameParams.username).substring(3,5) == 'CI') {
      profiling_type = "CI";
      agent.context.set({name: "Validation-CI-followup", lifespan: 2});
      agent.context.set({name: "name-CI", lifespan: 15,
                         parameters: {
                           "student_name": nameOfStudent
                         }
      });
    }
    else if((usernameParams.username).substring(3,5) == 'MI') {
      profiling_type = "MI";
      agent.context.set({name: "Validation-MI-followup", lifespan: 2});
      agent.context.set({name: "name-MI", lifespan: 15,
                         parameters: {
                           "student_name": nameOfStudent
                         }
      });
    }
  }
  

  function studentClassHandler(agent) {
    studentClass = agent.parameters.class;
    const result = () => {
      return `Alright. And what was your overall percentage in your final exams?`;
    };
    const response = result();
    agent.add(response);
  }

  
  function studentMarksHandler(agent) {
    const percentageHandler = (percentage) => {
      if(percentage > 85) {
        if (profiling_type == 'CI') {
          return `Wonderful! Are you fond of sports, ${nameOfStudent}?`;
        }
        else if (profiling_type == 'MI') {
          return `Wonderful! So ${nameOfStudent}, tell me more about who all are in your family?`;
        }
      }
      else if(percentage > 70 && percentage <= 85) {
        if (profiling_type == 'CI') {
          return `Great! Are you fond of sports, ${nameOfStudent}?`;
        }
        else if (profiling_type == 'MI') {
          return `Great! So ${nameOfStudent}, tell me more about who all are in your family?`;
        }
      }
      else if(percentage > 60 && percentage <= 70) {
        if (profiling_type == 'CI') {
          return `Good. Are you fond of sports, ${nameOfStudent}?`;
        }
        else if (profiling_type == 'MI') {
          return `Good. So ${nameOfStudent}, tell me more about who all are in your family?`;
        }
      }
      else {
        if (profiling_type == 'CI') {
          return `OK. Are you fond of sports, ${nameOfStudent}?`;
        }
        else if (profiling_type == 'MI') {
          return `OK. So ${nameOfStudent}, tell me more about who all are in your family?`;
        }
      }
    };
    const student_percentage = agent.parameters.percent;
    const response = percentageHandler(student_percentage);
    agent.add(response);
  }

  
  async function firebaseCall(parent,child,param) {
    try {
      const snapshot = await admin.database().ref(parent).once('value');
      for (let element of param) {
        const snapshot_1 = snapshot.child(child + "/" + element);
        if (snapshot_1.exists()) {
          const value = snapshot_1.val();
          if (value.includes(',')) {
            for (let val of value.split(',')) {
              if (val in personality_dict) {
                personality_dict[val] += 1;
              } 
              else {
                personality_dict[val] = 1;
              }
            }
          } 
          else {
            if (value in personality_dict) {
              personality_dict[value] += 1;
            } 
            else {
              personality_dict[value] = 1;
            }
          }
        }
      }
    }
    catch(error) {
      console.log(error);
    }
  }
  

  async function sportsGamesHandler(agent) {
    const sports_games = agent.parameters['sports-games'];
    try {
      await firebaseCall(profiling_type, "SportsGames", sports_games);
      agent.add(`Great! I want to know what you like to do in your pass time. Tell me all your hobbies.`);
    } 
    catch (error) {
      agent.add(`Sorry. It seems we encountered an error.`);
    }
  }
  

  async function hobbiesHandler(agent) {
    const hobbies = agent.parameters.hobbies;
    try {
      await firebaseCall(profiling_type, "Hobbies", hobbies);
      if (profiling_type == 'CI') {
        agent.add(`Nice! Any other activities that you enjoy doing? If yes, tell me about them.`);
      }
      else if (profiling_type == 'MI') {
        agent.add(`Nice! Tell me which are your favourite subjects ${nameOfStudent}?`);
      }
    } 
    catch (error) {
      agent.add(`Sorry. It seems we encountered an error.`);
    }
  }
  

  async function activitiesCIHandler(agent) {
    const activities = agent.parameters.hobbies;
    try {
   	  await firebaseCall(profiling_type, "Hobbies", activities);
      agent.add(`${nameOfStudent}, now tell me which are your favourite subjects?`);
    } 
    catch (error) {
      agent.add(`Sorry. It seems we encountered an error.`);
    }
  }
  

  async function subjectsFavHandler(agent) {
    const subjects = agent.parameters.subjects;
    try {
      await firebaseCall(profiling_type, "Subjects", subjects);
      if (subjects.length > 1) {
        agent.add(`Why are they your favourite subjects?`);
      }
      else {
        agent.add(`Why is it your favourite subject?`);
      }
    } catch (error) {
      agent.add(`Sorry. It seems we encountered an error.`);
    }
  }
  

  function subjectsNonFavHandler(agent) {
    weakSubjects = agent.parameters.subjects;
    if (weakSubjects.length > 1) {
      agent.add(`Why don't you like these subjects?`);
    }
    else {
      agent.add(`Why don't you like this subject?`);
    }
  }


  function getFutureCareers(agent) {
    if (profiling_type == "MI") {
      const career = agent.parameters.future_careers;
      futureCareers.push(career);
    }
    agent.add(`Why would you like to take up this career?`);
  }


  function getFutureOtherCareers(agent) {
    if (profiling_type == "MI") {
      const career = agent.parameters.future_other_careers;
      futureCareers.push(career);
    }
    agent.add(`And why are you considering this as your option?`);
  }


  function toggleProfilingPath(agent) {
    if (profiling_type == "CI") {
      agent.add(`Great, now let’s go ahead and take a look at the test scores in your report.`);
      agent.add(`But before that, let me tell you a little about the test itself.`);
      agent.add(`This test is based on the Theory of Careers and it profiles our vocational personalities. Would you like to know more about them?`);
      
      agent.context.set({name: "OtherCareer-Why-CI-followup", lifespan: 2});
    }
    else if (profiling_type == "MI") {
      agent.add(`Cool! Let us look at the career categories that come under your dominant intelligences and the potential career choices linked with them. Alright?`);
      
      agent.context.set({name: "CategoryPick-MI", lifespan: 2});
    }
  }
  

  async function personalityDescriptionHandler(agent) {
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      const snapshot_1 = snapshot.child("PersonalityDescription");
      if (profiling_type == 'MI') {
        agent.add(`The word intelligence is often defined as the IQ or intellectual potential of an individual. Considered as an inherent characteristic that can be measured and is difficult to change. This is not the case anymore!`);
        agent.add(`Theories suggest that each individual has multiple intelligences. Some are dominant, some supportive and some dormant. Each of these intelligences can be developed on desire. However, the dominant intelligences impact the way individuals learn and interact with the world around them.`);
        agent.add(`Let's look at the types of intelligences.`);
      }
      for (let key in snapshot_1.val()) {
        const value = snapshot.child("PersonalityDescription/" + key).val();
        agent.add(`${key}:${value}`);
      }
      agent.add(`<b>You will notice a button added to the left of the chatbox. Hover over the button to see what it will display on click!</b>`);
      agent.add(`Shall we proceed?`);
    }
    catch(error) {
      agent.add(`Some error occurred.`);
    }
  }


  function reportPersonalityCIHandler(agent) {
    careerInterestIndicator = (dominantTraitOne.charAt(0)).concat(dominantTraitTwo.charAt(0));
    agent.add(`Based on your report, your top two personality types are: <br>1. ${dominantTraitOne} (${dominantTraitOne.charAt(0)}) <br>2. ${dominantTraitTwo} (${dominantTraitTwo.charAt(0)}) <br>which taken together makes your Career Interest Indicator as <b>${careerInterestIndicator}</b>. Your predominant personality is ${dominantTraitOne} which is supported by a/an ${dominantTraitTwo} personality.`);
    agent.add(`Let me tell you more about ${careerInterestIndicator}s. Okay ${nameOfStudent}?`);
  }
  

  function reportIntelligenceMIHandler(agent) {
    agent.add(`The profiling indicates the dominant, supportive and dormant intelligences for each student.`);
    agent.add(`Based on your report, your dominant intelligences are: <br>1. ${dominantTraitOne} <br>2. ${dominantTraitTwo} <br>3. ${dominantTraitThree}`);
    agent.add(`Let me tell you more on these intelligences. Okay ${nameOfStudent}?`);
  }


  async function ciiDescriptionHandler(agent) {
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      const snapshot_1 = snapshot.child("CII-Desc/" + careerInterestIndicator);
      if (snapshot_1.exists()) {
        const description = snapshot_1.val();
        agent.add(`${careerInterestIndicator}:${description}`);
        agent.add(`Does that sound like you ${nameOfStudent}?`);
      }
    }
    catch(error) {
      agent.add(`Looks like we encountered an error.`);
    }
  }


  function studentIntelligenceDescHandler(agent) {
    console.log(`Individual intelligence descriptions`);
    agent.add(`Individual descriptions for each intelligence. (Dummy Data)`);
    agent.add(`Does that sound like you ${nameOfStudent}?`);
  }
  

  function traitsMatchHandler(agent) {
    const top_traits = Object.entries(personality_dict).sort((a,b) => b[1] - a[1])
      .map(el => el[0]);

    let max_value;
    if (profiling_type == "CI") {
      max_value = Math.max(personality_dict[dominantTraitOne], personality_dict[dominantTraitTwo]);
    }
    else if (profiling_type == "MI") {
      max_value = Math.max(personality_dict[dominantTraitOne], personality_dict[dominantTraitTwo], personality_dict[dominantTraitThree]);
    }

    let flag = 0;
    for (const trait of top_traits) {
      if (trait != dominantTraitOne && trait != dominantTraitTwo) {
        if (personality_dict[trait] >= max_value) {
          flag = 1;
          break;
        }
      }
    }

    if (flag == 1) {
      if (profiling_type == "CI") {
        agent.add(`Based on the inputs you have provided regarding your co-curricular interests, your dominant vocational personalities would be different from what the CIP test result indicates.`);
        agent.add(`However, we would proceed with the discussion considering what is indicated in the CIP test report. Ok?`);
      }
      else if (profiling_type == "MI") {
        agent.add(`Based on the inputs you have provided regarding your co-curricular interests, your dominant intelligences would be different from what the MIP test result indicates.`);
        agent.add(`However, we would proceed with the discussion considering what is indicated in the MIP test report. Ok?`);
      }
    }
    else {
      if (profiling_type == "CI") {
        agent.add(`Wow! Your hobbies and subjects of study you like also support your Career Interest Indicator. Isn’t that great?`);
      }
      else if (profiling_type == "MI") {
        agent.add(`Wow! Your hobbies and subjects of study you like also support your intelligences. Isn’t that great?`);
      }
    }
  }


  async function checkWeakSubjects(categories) {
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      let new_categories = categories.split('|');
      for (let i = 0; i < new_categories.length; i++) {
        const snapshot_1 = snapshot.child("Prerequisites/" + new_categories[i]);  
        if (snapshot_1.exists()) {
          const prerequisites = snapshot_1.val();
          
          for (let weak_subject of weakSubjects) {
            if (prerequisites.includes(weak_subject)) {
              new_categories[i] = 'Weak:' + new_categories[i];
              break;
            }
          }
        }
      }
      const string = new_categories.join('|');
      return string;
    }
    catch (error) {
      console.log(error);
    }
  }
  

  async function categoryPickCIHandler(agent) {
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      const snapshot_1 = snapshot.child("CII-Categories/" + careerInterestIndicator);
      if (snapshot_1.exists()) {
        const categories_all = snapshot_1.val();
        const new_categories = await checkWeakSubjects(categories_all);

        agent.add(`A typical ${careerInterestIndicator} can make a career in the following categories.`);
        agent.add(`Which of these categories interests you?`);
        agent.add(new_categories);
      }
    }
    catch(error) {
      agent.add(`Sorry, some error occurred.`);
    }
  }


  async function categoryPickMIHandler(agent) {
    try {
      const all_intelligences = [dominantTraitOne, dominantTraitTwo, dominantTraitThree];
      const snapshot = await admin.database().ref(profiling_type).once('value');
      for (let intelligence of all_intelligences) {
        const snapshot_1 = snapshot.child("CII-Categories/" + intelligence);
        if (snapshot_1.exists()) {
          const categories_all = snapshot_1.val();
          const new_categories = await checkWeakSubjects(categories_all);

          agent.add(`A typical ${intelligence} can make a career in the following categories.`);
          agent.add(`Which of these categories interests you?`);
          agent.add(new_categories);
        }
      }
    }
    catch(error) {
      agent.add(`Sorry, some error occurred.`);
    }
  }
  

  async function careerPickHandler(agent) {
    studentCategories = agent.parameters.categories;
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      for (let category of studentCategories) {
      	const snapshot_1 = snapshot.child("CareerCategory/" + category);
        if (snapshot_1.exists()) {
          const all_careers = snapshot_1.val();
          agent.add(`In ${category}, you can make the following careers.`);
          agent.add(`Which of these careers would you like to take up?`);
          agent.add(all_careers);
        }
      }
    }
    catch(error) { 
      agent.add(`Ran into an error. Sorry.`);
    }
  }
  

  async function toggleCareerDescHandler(agent) {
    const careers = agent.parameters.careers;
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      agent.add(`Okay!`);
      for(let career of careers) {
        let career_info = snapshot.child("CareerInformation/" + career).val();
        if (career_info == null || career_info == "null") {
          career_info = "Records to be added into database. (Dummy Data)";
        }
        agent.add(`${career}:${career_info}`);
      }
      
      if (profiling_type == "CI") {
        if(studentClass == '10' || studentClass == 'X') {
          agent.add(`Now ${nameOfStudent}, there are some subjects you will need to study in class 11th and 12th for making the careers you want. Do you want to know them?`);
        }
        else {
          agent.add(`So I am going to be ending our session here ${nameOfStudent}. I hope everything is clear?`);
          agent.context.set({name: "name-CI", lifespan: 2,
                          parameters: {
                            "student_name": nameOfStudent
                          }
          });
        }
      }
      else if (profiling_type == "MI") {
        agent.add(`Now ${nameOfStudent}, there are some subjects you will need to study in class 11th and 12th for making the careers you want. Do you want to know them?`);
      }
    }
    catch(error) {
      agent.add(`Some error occurred. Sorry about that.`);
    }
  }
  

  async function requiredSubjectsHandler(agent) {
    try {
      const snapshot = await admin.database().ref(profiling_type).once('value');
      for (let category of studentCategories) {
        const snapshot_1 = snapshot.child("Prerequisites/" + category);
        if (snapshot_1.exists()) {
          const subjects_req = snapshot_1.val();
          
          if (subjects_req == "No") {
            continue;
          }
          let subjectString = '';
          let count = 1;
          for (let subject of subjects_req.split(',')) {
            subjectString += `${count}. ${subject}<br>`;
            count += 1;
          }
          agent.add(`For a career in ${category} you will need to study the following subjects: <br>${subjectString}`);
        }
      }
      if (profiling_type == "CI") {
        agent.add(`So I am going to be ending our session here ${nameOfStudent}. I hope everything is clear?`);
        agent.context.set({name: "name-CI", lifespan: 2,
                         parameters: {
                           "student_name": nameOfStudent
                         }
        });
      }
      else if (profiling_type == "MI") {
        agent.add(`Alright. So few things that I want to share with you before we end the session. But till now everything is clear ${nameOfStudent}?`);
      }
    }
    catch(error) {
      agent.add(`Some problem occurred. Sorry.`);
    }
  }
  
  
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent - yes', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('GetPassword - yes', passwordHandler);
  intentMap.set('Validation - good', validationHandler);
  intentMap.set('StudentClass-CI', studentClassHandler);
  intentMap.set('StudentClass-MI', studentClassHandler);
  intentMap.set('StudentMarks-CI - yes', studentMarksHandler);
  intentMap.set('StudentMarks-MI', studentMarksHandler);
  intentMap.set('SportsGames - CI|Hobbies', sportsGamesHandler);
  intentMap.set('SportsGames - MI|Hobbies', sportsGamesHandler);
  intentMap.set('Hobbies - CI|Hobbies', hobbiesHandler);
  intentMap.set('Hobbies - MI|Subjects', hobbiesHandler);
  intentMap.set('Activities - CI|Subjects', activitiesCIHandler);
  intentMap.set('SubjectsFav-CI', subjectsFavHandler);
  intentMap.set('SubjectsFav-MI', subjectsFavHandler);
  intentMap.set('Subjects-NonFav-CI', subjectsNonFavHandler);
  intentMap.set('Subjects-NonFav-MI', subjectsNonFavHandler);
  intentMap.set('Careers-CI', getFutureCareers);
  intentMap.set('OtherCareers-CI', getFutureOtherCareers);
  intentMap.set('NoCareers-CI - yes', toggleProfilingPath);
  intentMap.set('NoOtherCareers-CI - yes', toggleProfilingPath);
  intentMap.set('OtherCareer-Why-CI - yes', toggleProfilingPath);
  intentMap.set('PersonalityDescription - yes', personalityDescriptionHandler);
  intentMap.set('IntelligenceDescription - yes', personalityDescriptionHandler);
  intentMap.set('ReportPersonality-CI - yes', reportPersonalityCIHandler);
  intentMap.set('ReportIntelligence-MI - yes', reportIntelligenceMIHandler);
  intentMap.set('CII-Description-CI - yes', ciiDescriptionHandler);
  intentMap.set('DOMDescriptions - yes', studentIntelligenceDescHandler);
  intentMap.set('CII-Match-CI - yes', traitsMatchHandler);
  intentMap.set('IntelligenceMatch-MI - yes', traitsMatchHandler);
  intentMap.set('CategoryPick-CI', categoryPickCIHandler);
  intentMap.set('CategoryPick-MI', categoryPickMIHandler);
  intentMap.set('CareerPick-CI', careerPickHandler);
  intentMap.set('CareerPick-MI', careerPickHandler);
  intentMap.set('ToggleEnd-CI - yes - CareerInfo', toggleCareerDescHandler);
  intentMap.set('CareerDesc-MI - CareerInfo', toggleCareerDescHandler);
  intentMap.set('RequiredSubjects-CI - yes', requiredSubjectsHandler);
  intentMap.set('RequiredSubjects-MI - yes', requiredSubjectsHandler);
  agent.handleRequest(intentMap);
});
