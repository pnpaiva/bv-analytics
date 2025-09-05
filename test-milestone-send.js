// Test script to send milestone celebration email
fetch('https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/send-test-milestone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'pedro@beyond-views.com'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));