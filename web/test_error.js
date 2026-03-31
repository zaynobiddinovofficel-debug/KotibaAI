const key = "8589d85c-47c0-4481-8c2a-ce39e5748fd4:e3080306-9b45-4382-8078-ce3cf011d801";
console.log("Testing with boolean true");
fetch("https://uzbekvoice.ai/api/v1/tts", {
  method: "POST",
  headers: { "Authorization": key, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Sinov boolean", model: "lola", blocking: true })
})
.then(res => res.json())
.then(data => console.log("Boolean true:", data))
.catch(console.error);

setTimeout(() => {
  console.log("Testing with string 'true'");
  fetch("https://uzbekvoice.ai/api/v1/tts", {
    method: "POST",
    headers: { "Authorization": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Sinov string", model: "lola", blocking: "true" })
  })
  .then(res => res.json())
  .then(data => console.log("String 'true':", data))
  .catch(console.error);
}, 2000);
