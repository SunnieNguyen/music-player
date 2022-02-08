/**
 * 1. Render songs
 * 2. Scroll top (xử lý phóng to/thu nhỏ CD)
 * 3. Play / Pause / Seek (tua)
 * 4. CD rotate
 * 5. Next / Pre
 * 6. Random
 * 7. Next / Repeat when ended
 * 8. Active song
 * 9. Scroll active song into view
 * 10. Play song when clicked
*/ 

// Làm vậy để chút gõ "$", thay vì "document.querySelector('...')"
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const PLAYER_STORAGE_KEY = 'Music-player'

const player = $('.player')
const cd = $('.cd')
const heading = $('header h2')
const cdThumb = $('.cd-thumb')
const audio = $('#audio')
const playBtn = $('.btn-toggle-play') 
const progress = $('#progress')
const nextBtn = $('.btn-next')
const preBtn = $('.btn-prev')
const randomBtn = $('.btn-random')
const repeatBtn = $('.btn-repeat')
const playlist = $('.playlist')

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    songs: [
        {
            name: 'Up & down',
            singer: 'Iduno',
            path: './assets/music/ES.Up . Down.mp3',
            image: './assets/img/up.down.jpg'
        },
        {
            name: 'Free your mind',
            singer: 'Iduno 1',
            path: './assets/music/ES_Free Your Mind.mp3',
            image: './assets/img/free-your-mind.jpg'
        },
        {
            name: 'Blue lemonade',
            singer: 'Iduno 2',
            path: './assets/music/FMVblue_lemonade_.mp3',
            image: './assets/img/blue-lemonade.jpg'
        },
        {
            name: 'Another time',
            singer: 'Iduno 3',
            path: './assets/music/Another time.wav',
            image: './assets/img/another time.jpg'
        },
        {
            name: 'Castle',
            singer: 'Iduno 4',
            path: './assets/music/Castle by Harddope . Clarx on NCS.mp3',
            image: './assets/img/castle.jpg'
        },
        {
            name: 'Army',
            singer: 'Iduno 5',
            path: './assets/music/army-1597319251-ObmDuwWdiZ.mp3',
            image: './assets/img/army.jpg'
        },
        {
            name: 'Feel good',
            singer: 'Iduno 6',
            path: './assets/music/MBB - Feel Good.mp3',
            image: './assets/img/feel good.jpg'
        },
    ],

    // settings
    
    // 1. Render songs
    render() {
        const htmls = this.songs.map((song, index) => { // 8. Active song (cái ${...} đầu tiên)
            return `
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index = ${index}>
                    <div class="thumb" style="background-image: url('${song.image}')">
                    </div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `;
        })
        playlist.innerHTML = htmls.join('');
    },
    defineProperties() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        })
    },
    handleEvents() {
        const _this = this // this = app
        // "offsetWidth" ở ngoài "onscroll", để nó cố định width ban đầu
        const cdWidth = cd.offsetWidth

        // 4. CD rotate
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)' }
        ], {
            duration: 10000,
            iterations: Infinity
        })
        cdThumbAnimate.pause()
        
        // 2. Scroll top
        document.onscroll = () => {
            // Vị trí thay đổi khi mình scroll, có 2 cách để gọi, tùy trình duyệt
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            // càng kéo lên -> vị trí càng tăng (scrollTop) thì CD càng nhỏ dần (newCdWidth)
            const newCdWidth = cdWidth - scrollTop
            
            // Nếu newCdWidth > 0, thì nó trả về chính nó, ngược lại trả về 0
            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0
            cd.style.opacity = newCdWidth / cdWidth
        }

        // 3. Play / Pause / Seek
        // Xử lý khi Play / Pause
        playBtn.onclick = () => {
            if (_this.isPlaying) {
                audio.pause()
            } else {
                audio.play()
            }
        }
        // Lắng nghe Play / Pause
        audio.onplay = () => {
            _this.isPlaying = true
            player.classList.add('playing')
            cdThumbAnimate.play()
        }
        audio.onpause = () => {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause()
        }
        // Xử lý tiến độ thanh nhạc (Seek)
        audio.ontimeupdate = () => {
            // ban đầu "duration" = NaN
            if (audio.duration) {
                const progressPercent = audio.currentTime / audio.duration * 100
                progress.value = progressPercent
            }
        }
        // Xử lý tua bài hát
        progress.oninput = e => {
            const seekTime = e.target.value * audio.duration / 100
            audio.currentTime = seekTime
        }

        // Xử lý next song
        nextBtn.onclick = () => {
            if (this.isRandom) {
                this.randomSong();
            } else {
                this.nextSong()
            }
            audio.play()

            // render lại để chuyển 'active' bài hát, ứng dụng nhỏ nên dùng cách này cho nhanh
            this.render()

            // 9. Scroll active song into view
            this.scrollToActiveSong()
        }
        // Xử lý previous song
        preBtn.onclick = () => {
            if (this.isRandom) {
                this.randomSong();
            } else {
                this.preSong()
            }
            audio.play()

            // render lại để chuyển 'active' bài hát, ứng dụng nhỏ nên dùng cách này cho nhanh
            this.render()

            // 9. Scroll active song into view
            this.scrollToActiveSong()
        }

        // Xử lý random song
        randomBtn.onclick = () => {
            this.isRandom = !this.isRandom
            // lưu config random
            musicPlayerSetting.set('isRandom', this.isRandom)
            // đối số thứ 2 của toggle: nếu true -> add 'active', nếu false -> remove 'active'
            randomBtn.classList.toggle('active', this.isRandom)
        }

        // 7. Next / Repeat when ended
        // Xử lý Next when ended
        audio.onended = () => {
            if (this.isRepeat) {
                audio.play()
            } else {
                // Mỗi lần đến cuối, máy tự ấn next cho mình
                nextBtn.click()
            }
        }
        // Xử lý Repeat when ended, giống thằng random song
        repeatBtn.onclick = () => {
            this.isRepeat = !this.isRepeat
            // lưu config repeat
            musicPlayerSetting.set('isRepeat', this.isRepeat)
            repeatBtn.classList.toggle('active', this.isRepeat)
        }

        // 10. Play song when clicked
        playlist.onclick = e => {
            // tự search closest
            // click vào cái gì cũng được trừ thằng đang active
            const songNode = e.target.closest('.song:not(.active)') 
            if (songNode || e.target.closest('.option')) {
                // xử lý khi click vào song
                if (songNode) {
                    // convert sang number vì ban đầu nó là string
                    this.currentIndex = Number(songNode.getAttribute('data-index'))
                    this.loadCurrentSong()
                    audio.play()
                    this.render()
                }

                // xử lý khi click vào option
                if (e.target.closest('.option')) {

                }
            }
        }
    },
    loadCurrentSong() {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path;
    },
    // 5. Next / Pre
    nextSong() {
        this.currentIndex++
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0
        }
        this.loadCurrentSong()
    },
    preSong() {
        this.currentIndex--
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1
        }
        this.loadCurrentSong()
    },
    // 6. Random
    randomSong() {
        let newIndex
        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (newIndex === this.currentIndex)
        this.currentIndex = newIndex
        this.loadCurrentSong()
        // New Idea (random 1 đợt mà mỗi bài hát không play từ 2 lần trở lên): mỗi lần random ra 1 số, mình cho số random đó vào 1 mảng, 
        // mảng này các số đều khác nhau, cho đến khi số lượng ptử mảng này bằng số lượng ptử mảng songs => reset lại mảng này và tiếp tục sang đợt tiếp theo.
    },
    scrollToActiveSong() {
        // tự search gg thằng scrollIntoView
        setTimeout($('.song.active').scrollIntoView({
            // behavior: "smooth", 
            block: "end", 
        }), 500)
    },
    loadConfig() {
        this.isRandom = musicPlayerSetting.get('isRandom') || false // "|| false" -> logical, vì ban đầu localStorage rỗng (ko thể get dc, nên mặc định là false)
        this.isRepeat = musicPlayerSetting.get('isRepeat') || false
        randomBtn.classList.toggle('active', this.isRandom)
        repeatBtn.classList.toggle('active', this.isRepeat)
    },
    start() {
        // gán cấu hình từ config vào ứng dụng, để mỗi lần F5 vẫn ko mất settings
        this.loadConfig();

        // Định nghĩa các thuộc tính cho object
        this.defineProperties();

        // Lắng nghe / xử lý các sự kiện (DOM events)
        this.handleEvents();

        // Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong();

        // Render playlist
        this.render();
    }
}

// Config 
function createStorage(key) {
    const store = JSON.parse(localStorage.getItem(key)) || {}
    
    const save = () => {
        localStorage.setItem(key, JSON.stringify(store))
    }

    const storage = {
        get(key) {
            return store[key]
        },
        set(key, value) {
            store[key] = value
            save()
        },
        remove(key) {
            delete store[key]
            save()
        }
    }

    return storage
}
const musicPlayerSetting = createStorage(PLAYER_STORAGE_KEY)

app.start();


