'use strict';

// --- 상태 관리 ---
const state = {
    worries: [],
    currentPage: 'home', // home, my-posts, community
};

// --- 데이터 관리 (LocalStorage) ---
const DataManager = {
    getWorries() {
        const worriesJSON = localStorage.getItem('temperatureOfHeart');
        if (worriesJSON) {
            return JSON.parse(worriesJSON);
        } else {
            // 데이터가 없으면 초기 시드 데이터 생성
            return this.seed();
        }
    },
    saveWorries() {
        localStorage.setItem('temperatureOfHeart', JSON.stringify(state.worries));
    },
    seed() {
        const seedData = [
            {
                id: `worry-${Date.now()}-1`,
                text: "요즘 부쩍 외롭다는 생각이 들어요. 다들 잘 지내는 것 같은데 저만 도태되는 기분이에요.",
                timestamp: new Date().toISOString(),
                isMe: false,
                replies: [
                    { id: `reply-${Date.now()}-1`, text: "그런 기분 정말 잘 알아요. 하지만 보이는 게 전부는 아니더라고요. 모두들 각자의 힘듦을 안고 살아가요. 당신도 충분히 잘하고 있어요.", timestamp: new Date().toISOString(), isAdopted: false },
                    { id: `reply-${Date.now()}-2`, text: "외로움은 누구나 느끼는 감정이에요. 혼자라고 생각될 때, 이곳에 와서 이야기를 나눠보세요. 분명 마음이 따뜻해질 거예요.", timestamp: new Date().toISOString(), isAdopted: true },
                ]
            },
            {
                id: `worry-${Date.now()}-2`,
                text: "새로운 도전을 앞두고 있는데, 잘 해낼 수 있을지 자신이 없어요. 실패할까 봐 두려워요.",
                timestamp: new Date().toISOString(),
                isMe: false,
                replies: [
                    { id: `reply-${Date.now()}-3`, text: "도전하는 것만으로도 정말 대단한 용기예요! 결과에 상관없이 그 과정은 당신에게 소중한 자산이 될 거예요. 응원할게요!", timestamp: new Date().toISOString(), isAdopted: false },
                ]
            }
        ];
        state.worries = seedData;
        this.saveWorries();
        return seedData;
    }
};

// --- UI 렌더링 ---
const UIRenderer = {
    render() {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        // 현재 페이지 표시
        const currentPageEl = document.getElementById(`${state.currentPage}-page`);
        if (currentPageEl) {
            currentPageEl.classList.add('active');
        }

        switch (state.currentPage) {
            case 'my-posts':
                this.renderMyPostsPage();
                break;
            case 'community':
                this.renderCommunityPage();
                break;
            case 'home':
            default:
                this.renderHomePage();
                break;
        }
    },

    renderHomePage() {
        // 홈 페이지는 기본 HTML 구조를 사용하므로 특별한 렌더링이 필요 없을 수 있음
        // 하지만 동적으로 생성된 컨텐츠가 있다면 여기에 로직 추가
        const lettersContainer = document.getElementById('letters-container');
        lettersContainer.innerHTML = '<h2>📝 최근 남겨진 온기</h2> <p>고민을 남기면 이곳에 다른 사람들의 따뜻한 마음이 도착할 거예요.</p>';
    },

    renderMyPostsPage() {
        const container = document.getElementById('my-posts-container');
        const myWorries = state.worries.filter(w => w.isMe).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (myWorries.length === 0) {
            container.innerHTML = '<p>아직 작성한 고민이 없어요. 홈에서 당신의 이야기를 들려주세요.</p>';
            return;
        }

        container.innerHTML = myWorries.map(worry => this.createPostHTML(worry, true)).join('');
    },

    renderCommunityPage() {
        const container = document.getElementById('community-posts-container');
        const communityWorries = state.worries.filter(w => !w.isMe).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (communityWorries.length === 0) {
            container.innerHTML = '<p>다른 사람들의 이야기가 아직 없네요.</p>';
            return;
        }
        
        container.innerHTML = communityWorries.map(worry => this.createPostHTML(worry, false)).join('');
    },
    
    createPostHTML(worry, isMyPost) {
        const repliesHTML = worry.replies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(reply => `
            <div class="reply-card ${reply.isAdopted ? 'adopted' : ''}" data-reply-id="${reply.id}">
                <p>${reply.text}</p>
                <div class="reply-actions">
                    ${isMyPost ? `<button class="adopt-btn" data-action="adopt-reply" data-worry-id="${worry.id}" data-reply-id="${reply.id}" ${reply.isAdopted ? 'disabled' : ''}>${reply.isAdopted ? '채택됨' : '채택하기'}</button>` : ''}
                </div>
            </div>
        `).join('');

        const replyFormHTML = !isMyPost ? `
            <form class="reply-input-form" data-action="submit-reply" data-worry-id="${worry.id}">
                <textarea placeholder="따뜻한 마음을 나눠주세요..."></textarea>
                <button type="submit">답장 남기기</button>
            </form>
        ` : '';

        return `
            <div class="post-card" data-worry-id="${worry.id}">
                <p class="worry-content">${worry.text}</p>
                <div class="replies-section">
                    ${repliesHTML || '<p style="opacity: 0.7; text-align:center;">아직 도착한 마음이 없어요.</p>'}
                </div>
                ${replyFormHTML}
            </div>
        `;
    }
};

// --- 애플리케이션 로직 ---
const App = {
    init() {
        state.worries = DataManager.getWorries();
        this.setupEventListeners();
        
        // URL 해시를 기반으로 초기 페이지 설정
        const hash = window.location.hash.replace('#', '');
        if (['home', 'my-posts', 'community'].includes(hash)) {
            state.currentPage = hash;
        }
        
        UIRenderer.render();
        this.updateNav();
    },

    setupEventListeners() {
        // 네비게이션
        const nav = document.querySelector('nav');
        nav.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                const page = e.target.hash.replace('#', '');
                this.navigate(page);
            }
        });

        // 메인 컨텐츠 영역의 이벤트 위임
        const main = document.querySelector('main');
        main.addEventListener('click', e => {
            const target = e.target;
            const action = target.dataset.action || (target.closest('form') ? target.closest('form').dataset.action : null);

            if (action === 'adopt-reply') {
                const worryId = target.dataset.worryId;
                const replyId = target.dataset.replyId;
                this.handleAdoptReply(worryId, replyId);
            }
        });

        main.addEventListener('submit', e => {
             const target = e.target;
             const action = target.dataset.action;

            if (action === 'submit-reply') {
                e.preventDefault();
                const worryId = target.dataset.worryId;
                const textarea = target.querySelector('textarea');
                this.handleReplySubmit(worryId, textarea.value);
                textarea.value = '';
            }
        });
        
        // 홈 페이지 고민 제출
        const worrySubmitBtn = document.getElementById('submit-worry');
        worrySubmitBtn.addEventListener('click', () => {
             const input = document.getElementById('worry-input');
             this.handleWorrySubmit(input.value);
             input.value = '';
        });
    },

    navigate(page) {
        state.currentPage = page;
        window.location.hash = page;
        this.updateNav();
        UIRenderer.render();
    },

    updateNav() {
        document.querySelectorAll('nav a').forEach(a => {
            if (a.hash.replace('#', '') === state.currentPage) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    },

    handleWorrySubmit(text) {
        text = text.trim();
        if (!text) {
            alert('이야기를 들려주세요.');
            return;
        }
        const newWorry = {
            id: `worry-${Date.now()}`,
            text,
            timestamp: new Date().toISOString(),
            isMe: true,
            replies: []
        };
        state.worries.push(newWorry);
        DataManager.saveWorries();
        alert('당신의 이야기가 기록되었어요. "내 고민" 페이지에서 확인해보세요.');
        this.navigate('my-posts');
    },

    handleReplySubmit(worryId, text) {
        text = text.trim();
        if (!text) {
            alert('따뜻한 마음을 나눠주세요.');
            return;
        }
        const worry = state.worries.find(w => w.id === worryId);
        if (worry) {
            const newReply = {
                id: `reply-${Date.now()}`,
                text,
                timestamp: new Date().toISOString(),
                isAdopted: false,
            };
            worry.replies.push(newReply);
            DataManager.saveWorries();
            UIRenderer.render(); // 현재 뷰 다시 렌더링
        }
    },

    handleAdoptReply(worryId, replyIdToAdopt) {
        const worry = state.worries.find(w => w.id === worryId);
        if (worry) {
            // 모든 답장의 채택 상태를 false로 초기화
            worry.replies.forEach(reply => {
                reply.isAdopted = false;
            });
            // 선택된 답장만 채택 상태로 변경
            const replyToAdopt = worry.replies.find(r => r.id === replyIdToAdopt);
            if (replyToAdopt) {
                replyToAdopt.isAdopted = true;
            }
            DataManager.saveWorries();
            UIRenderer.render(); // 현재 뷰 다시 렌더링
        }
    }
};

// --- 앱 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});