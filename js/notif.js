
let title = document.getElementById("title").value
let msg = document.getElementById("msg").value
const phoneToken = "c677qUflSPa4gd_HY-Vmzc:APA91bFqfHRa3CmWif6W7qR0PwGF1m48cutZzklyNURed3nG_Bm0LBm7ByR_tQd5sHz43y0o3XWy1b4iJT7QdyGfaALSpZmJJ15NdoMU7zYNNtzu5EM1I1Y"

document.getElementById("sendNotif").addEventListener("click", ()=>{
    console.log("clicked")
    sendNotification(phoneToken, title, msg)
})

