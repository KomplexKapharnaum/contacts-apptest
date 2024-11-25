const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

let title = document.getElementById("title").value
let msg = document.getElementById("msg").value
const phoneToken = "c677qUflSPa4gd_HY-Vmzc:APA91bFqfHRa3CmWif6W7qR0PwGF1m48cutZzklyNURed3nG_Bm0LBm7ByR_tQd5sHz43y0o3XWy1b4iJT7QdyGfaALSpZmJJ15NdoMU7zYNNtzu5EM1I1Y"

document.getElementById("sendNotif").addEventListener("click", ()=>{
    sendNotification(phoneToken, title, msg)
})

async function sendNotification(fcmToken, title, body) {
    const auth = new GoogleAuth({
        keyFile: '../generate-token.js',
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessToken = await auth.getAccessToken();

    const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/84325436128/messages:send`,
        {
            message: {
                token: fcmToken, // The target device's registration token
                notification: {
                    title: title,
                    body: body,
                },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`, // OAuth 2.0 token
                'Content-Type': 'application/json',
            },
        }
    );

    console.log('Notification sent:', response.data);


    // Example usage
    // sendNotification('<DEVICE_FCM_TOKEN>', 'Hello!', 'This is a test notification.');

}