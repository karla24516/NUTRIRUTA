const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(compression());
app.use((req,res,next)=>{
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com 'self'; img-src 'self' data:;");
  next();
});
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  maxAge: '1h',
  setHeaders(res, filePath){
    if(filePath.endsWith('index.html')){
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NUTRIRUTA escuchando en http://localhost:${PORT}`);
});

