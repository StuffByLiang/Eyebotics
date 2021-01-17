# eyebotics

## Inspiration
12.44 million people in the United States live with blindness or visual impairments (US Centre for Disease Control & Prevention, 2015). This number is projected to reach 25.36 million by 2050. 

These people face innumerous challenges, including difficulty with navigation, crossing the street, and recognizing expressions and emotions in others (especially strangers). Currently, people who are blind or visually impaired need to rely on walking sticks, service dogs, and/or caretakers to assist them through their daily lives. This results in a 


## What it does
Assistive live-camera technology for the visually impaired that uses computer vision to deliver a wide range of functionalities.
* Real-time video object recognition
* Person analyzer (age, gender, facial expression)
* Learns to recognize your friends & family
* Fully voice-command activated & controlled
* All output & feedback is audio


## How we built it
The application is mainly built in Node.js and Express.js. However, our main feature is centered around using Tensorflow to load a webcam which the visually impaired individuals can use to detect and identify the different emotions of people, as well as recognizing objects presented in front of them. In addition, we used Google Cloud Vision API to extract texts out of screenshots uploaded by the users, IBM Watson to transcribe speech to texts. 

## Challenges we ran into
* Uploading a picture from front end and getting it to the back end, for reading text from an image out loud
* Trying to make sense of tensorflow 
* Async / await functions in js 
* Combining multiple recognition features to accurately predict age, gender, identity, and facial expressions all simultaneously

## Accomplishments that we're proud of
* Creating a fully functional voice assistant that can identify each member of our team and accurately predict age, gender, and nearby objects
* Contributing to making things more accessible to people who are blind in under 36 hours!  

## What's next for eyebotics
* Include a text-summarizer that can concisely read aloud large paragraphs
* Connect Eyebotics to external strap on camera (ie. Go-Pro) for non-stop real time usage
* Allow user to add new people to “familiar faces” list with voice command
* Use computer vision to count money in real-time through live video for user
