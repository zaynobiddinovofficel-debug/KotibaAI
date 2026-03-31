const key = "8589d85c-47c0-4481-8c2a-ce39e5748fd4:e3080306-9b45-4382-8078-ce3cf011d801";
fetch("https://uzbekvoice.ai/api/v1/tts", {
  method: "POST",
  headers: {
    "Authorization": key,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Salom dunyo",
    model: "lola",
    blocking: "true"
  })
}).then(res => {
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  return res.text();
}).then(text => {
  console.log("Response:", text.substring(0, 200));
}).catch(console.error);
