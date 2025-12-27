
    /* ====== المان‌ها ====== */
    const playBtn = document.getElementById('playBtn');
    const surpriseBtn = document.getElementById('surpriseBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const photoInput = document.getElementById('photoInput');
    const profilePhoto = document.getElementById('profilePhoto');
    const bgMusic = document.getElementById('bgMusic');
    const panel = document.getElementById('panel');
    const innerPanel = document.getElementById('innerPanel');
    const cake = document.getElementById('cake');
    const candles = document.getElementById('candles');
    const cakeSmile = document.getElementById('cakeSmile');
    const blowBtn = document.getElementById('blowBtn');
    const balloons = document.getElementById('balloons');
    const bgCanvas = document.getElementById('bgCanvas');

    let musicPlaying = false;
    let flipped = false;
    let confettiActive = false;

    /* ====== پخش موزیک ====== */
    playBtn.addEventListener('click', async () => {
      try {
        if (!musicPlaying) {
          await bgMusic.play();
          musicPlaying = true;
          playBtn.textContent = 'خاموش کردن موزیک 🔈';
          playBtn.style.transform = 'translateY(-2px) scale(1.02)';
        } else {
          bgMusic.pause();
          musicPlaying = false;
          playBtn.textContent = 'پخش موزیک 🎵';
          playBtn.style.transform = '';
        }
      } catch(e) { console.warn('پخش موزیک بلاک شد', e); }
    });

    /* ====== آپلود عکس ====== */
    uploadBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) {
        const r = new FileReader();
        r.onload = () => profilePhoto.src = r.result;
        r.readAsDataURL(f);
      }
    });

    /* ====== سورپرایز: فلیپ + بالن رقصان + کنفتی ====== */
    surpriseBtn.addEventListener('click', () => {
      flipPanel();
      burstConfetti();
      danceBalloons();
    });

    resetBtn.addEventListener('click', () => {
      // reset UI
      if (musicPlaying) { bgMusic.pause(); bgMusic.currentTime = 0; musicPlaying = false; playBtn.textContent = 'پخش موزیک 🎵'; }
      unflipPanel();
      stopConfetti();
      stopBalloons();
      // relight candles
      lightCandles();
    });

    function flipPanel() {
      if (!flipped) {
        panel.classList.add('flipped');
        flipped = true;
      } else {
        panel.classList.remove('flipped');
        flipped = false;
      }
    }
    function unflipPanel(){ panel.classList.remove('flipped'); flipped=false; }

    /* ====== کیک: فوت کردن شمع ====== */
    function lightCandles() {
      const flames = candles.querySelectorAll('.flame');
      flames.forEach(f => f.style.display = 'block');
      cakeSmile.textContent = '😊';
    }
    function blowCandles() {
      const flames = candles.querySelectorAll('.flame');
      flames.forEach((f, i) => {
        // افکت خاموش شدن با انیمیشن
        f.animate([{ transform: 'scale(1)', opacity:1 }, { transform: 'scale(.2)', opacity:0 }], { duration:800 + i*80, easing:'cubic-bezier(.2,.9,.3,1)' }).onfinish = () => f.style.display='none';
      });
      // کیک لبخند به چهرهٔ شوخ‌تری تبدیل می‌شود
      cakeSmile.animate([{ transform:'scale(1)' }, { transform:'scale(1.16)' }, { transform:'scale(1)' }], { duration:600, easing:'ease-out' });
      cakeSmile.textContent = '😄';
      // پاداش: انفجار کنفتی و فان
      burstConfetti(1000);
    }

    blowBtn.addEventListener('click', () => {
      blowCandles();
    });

    // گوش دادن به صدا برای فوت واقعی (اختیاری)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      let listening=false;
      blowBtn.addEventListener('contextmenu', (e)=>e.preventDefault());
      // Start mic on long-press (user-interaction required)
      blowBtn.addEventListener('mousedown', async () => {
        if (listening) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyzer = audioCtx.createAnalyser();
          source.connect(analyzer);
          analyzer.fftSize = 256;
          const data = new Uint8Array(analyzer.frequencyBinCount);
          listening = true;
          const check = () => {
            analyzer.getByteFrequencyData(data);
            const sum = data.reduce((s,v)=>s+v,0);
            if (sum > 5000) { // threshold for loud blow
              blowCandles();
              stream.getTracks().forEach(t=>t.stop());
              listening=false;
            } else {
              requestAnimationFrame(check);
            }
          };
          requestAnimationFrame(check);
        } catch(e) {
          console.warn('دسترسی میکروفون رد شد یا در دسترس نیست', e);
        }
      });
    }

    /* ====== بالون‌ها: رقص و پرواز ====== */
    let balloonTimers = [];
    function danceBalloons() {
      // اضافه کردن انیمیشن جالب برای balloons children
      const nodes = balloons.querySelectorAll('.balloon');
      nodes.forEach((b, idx) => {
        b.style.transition = `transform 900ms cubic-bezier(.2,.9,.2,1), left 900ms ease`;
        const id = setInterval(() => {
          const dx = (Math.random()-0.5)*24;
          const dy = (Math.random()-0.5)*18;
          const rot = (Math.random()-0.5)*12;
          b.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        }, 700 + idx*120);
        balloonTimers.push(id);
      });
      // gentle upward movement
      balloons.animate([{ transform:'translateY(0)' }, { transform:'translateY(-18px)' }, { transform:'translateY(0)' }], { duration: 2200, iterations: 4 });
    }
    function stopBalloons() {
      balloonTimers.forEach(t => clearInterval(t));
      balloonTimers = [];
      const nodes = balloons.querySelectorAll('.balloon');
      nodes.forEach(b => b.style.transform='');
    }

    /* ====== کنفتی: سیستم پارتیکل روی canvas ====== */
    const confCanvas = document.createElement('canvas');
    confCanvas.style.position='fixed'; confCanvas.style.inset=0; confCanvas.style.pointerEvents='none'; confCanvas.style.zIndex=9999;
    document.body.appendChild(confCanvas);
    const cctx = confCanvas.getContext('2d');
    function resizeConfetti(){ confCanvas.width = innerWidth; confCanvas.height = innerHeight; }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    let confettiPieces = [];
    function Confetto(x,y) {
      this.x=x; this.y=y;
      this.vx = (Math.random()-0.5)*8;
      this.vy = -6 - Math.random()*6;
      this.size = 6 + Math.random()*10;
      this.hue = 320 + Math.random()*80;
      this.life = 0;
      this.rot = Math.random()*360;
      this.vr = (Math.random()-0.5)*12;
    }
    Confetto.prototype.update = function(dt){
      this.vy += 0.2*dt;
      this.x += this.vx*dt;
      this.y += this.vy*dt;
      this.rot += this.vr*dt;
      this.life += dt;
    };
    Confetto.prototype.draw = function(ctx){
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot*Math.PI/180);
      ctx.globalAlpha = Math.max(0, 1 - this.life/100);
      ctx.fillStyle = `hsl(${this.hue},80%,60%)`;
      ctx.fillRect(-this.size/2, -this.size*0.8, this.size, this.size*1.6);
      ctx.restore();
    };

    let confettiRAF;
    function confettiLoop(now) {
      cctx.clearRect(0,0,confCanvas.width, confCanvas.height);
      for (let i=0;i<confettiPieces.length;i++){
        confettiPieces[i].update(1);
        confettiPieces[i].draw(cctx);
      }
      confettiPieces = confettiPieces.filter(p => p.y < confCanvas.height + 200 && p.life < 160);
      if (confettiPieces.length>0) confettiRAF = requestAnimationFrame(confettiLoop);
      else { cancelAnimationFrame(confettiRAF); confettiActive=false; cctx.clearRect(0,0,confCanvas.width,confCanvas.height); }
    }
    function burstConfetti(amount = 240) {
      if (confettiActive) return;
      confettiActive = true;
      const cx = innerWidth/2;
      const cy = innerHeight/3;
      for (let i=0;i<amount;i++){
        confettiPieces.push(new Confetto(cx + (Math.random()-0.5)*600, cy + (Math.random()-0.5)*150));
      }
      cancelAnimationFrame(confettiRAF);
      confettiRAF = requestAnimationFrame(confettiLoop);
    }
    function stopConfetti(){ confettiPieces = []; confettiActive=false; cctx.clearRect(0,0,confCanvas.width,confCanvas.height); cancelAnimationFrame(confettiRAF); }

    /* ====== پس‌زمینه: ذرات نور نرم ====== */
    const canvas = bgCanvas;
    const ctx = canvas.getContext('2d');
    function resizeBg(){ canvas.width = innerWidth; canvas.height = innerHeight; }
    window.addEventListener('resize', resizeBg);
    resizeBg();

    const stars = [];
    function spawnStars(){
      stars.length=0;
      for (let i=0;i<28;i++){
        stars.push({
          x: Math.random()*canvas.width,
          y: Math.random()*canvas.height,
          r: 6 + Math.random()*22,
          hue: 300 + Math.random()*80,
          alpha: 0.05 + Math.random()*0.18,
          vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2
        });
      }
    }
    spawnStars();
    function drawStars(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (let s of stars){
        s.x += s.vx; s.y += s.vy;
        if (s.x < -50) s.x = canvas.width + 50;
        if (s.x > canvas.width + 50) s.x = -50;
        if (s.y < -50) s.y = canvas.height + 50;
        if (s.y > canvas.height + 50) s.y = -50;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, `hsla(${s.hue}, 90%, 70%, ${s.alpha})`);
        g.addColorStop(0.6, `hsla(${s.hue}, 80%, 75%, ${s.alpha*0.4})`);
        g.addColorStop(1, `hsla(${s.hue}, 60%, 80%, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(s.x - s.r, s.y - s.r, s.r*2, s.r*2);
      }
      requestAnimationFrame(drawStars);
    }
    drawStars();

    /* ====== واکنش‌های ظریف: hover و ورود ====== */
    window.addEventListener('load', () => {
      document.querySelector('.stage').animate([{ transform:'translateY(20px)', opacity:0 }, { transform:'translateY(0)', opacity:1 }], { duration:700, easing:'cubic-bezier(.2,.9,.3,1)' });
      // subtle profile tilt follow
      const photoWrap = document.getElementById('photoWrap');
      document.addEventListener('pointermove', e => {
        const nx = (e.clientX / window.innerWidth - 0.5);
        const ny = (e.clientY / window.innerHeight - 0.5);
        photoWrap.style.transform = `perspective(800px) rotateY(${nx*6}deg) rotateX(${-ny*4}deg)`;
      });
    });

    /* ====== دسترسی: ESC برای ریست ====== */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') resetBtn.click();
    });

    /* ====== روشن/خاموش شمع اولیه ====== */
    function initCandles(){
      const flames = candles.querySelectorAll('.flame');
      flames.forEach(f => f.style.display = 'block');
    }
    initCandles();

    /* ====== helpers: small surprise on click of cake area (also flips smile) ====== */
    cake.addEventListener('click', () => {
      cake.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform:'translateY(0)' }], { duration:420, easing:'ease-out' });
      cakeSmile.animate([{ transform:'translateY(0)' }, { transform:'translateY(-6px)' }, { transform:'translateY(0)' }], { duration:420 });
      // playful micro-confetti
      burstConfetti(80);
    });

    /* ====== پاکسازی قبل از خروج ====== */
    window.addEventListener('beforeunload', () => {
      stopConfetti();
      stopBalloons();
    });

    /* ====== نکته: جایگذاری موزیک و عکس ======
       - برای تغییر موزیک: <audio id="bgMusic" src="YOUR_URL_HERE"> و کاربر خود دکمه پخش را بزند.
       - برای عکس: از دکمه "بارگذاری عکس" استفاده کن یا آدرس داخل <img id="profilePhoto"> را عوض کن.
    ====== */
// 😘 دکمه بوس
kissBtn.addEventListener("click", () => {
      for (let i = 0; i < 6; i++) createKiss();
    });

    function createKiss() {
      const kiss = document.createElement("div");
      kiss.className = "kiss";
      kiss.textContent = ["💋","😘","😍","💖"][Math.floor(Math.random()*4)];
      kiss.style.left = (window.innerWidth/2 - 40 + Math.random()*80) + "px";
      kiss.style.bottom = "40px";
      document.body.appendChild(kiss);
      setTimeout(()=>kiss.remove(), 2000);
    }