'use strict';

// --- 초기 데이터 및 설정 ---
const SEED_WORRIES = [
    { id: 'seed-1', author: '어느 여행자', text: '열심히 달려왔는데, 문득 모든 게 무의미하게 느껴질 때가 있어요. 다들 저마다의 의미를 찾은 것 같은데 저만 길을 잃은 기분이에요.', replies: [] },
    { id: 'seed-2', author: '작은 별', text: '사소한 말 한마디에 온종일 마음이 쓰여요. 다른 사람들은 쉽게 넘기는 일도 저는 왜 이렇게 어려울까요?', replies: [] },
    { id: 'seed-3', author: '익명', text: '새로운 시작을 앞두고 설레는 마음보다 두려운 마음이 더 커요. 잘 해낼 수 있을까요?', replies: [] },
];

const PRE_WRITTEN_REPLIES = [
    '그 마음, 저도 알 것 같아요. 잠시 쉬어가도 괜찮아요. 당신의 속도대로 천천히 나아가면 돼요.',
    '이야기해주셔서 고마워요. 당신의 용기가 누군가에게는 큰 위로가 될 거예요.',
    '결과가 어떻든, 당신의 모든 노력은 별처럼 반짝이고 있어요. 스스로를 믿어주세요.',
    '그런 감정은 지극히 자연스러운 거예요. 혼자 끙끙 앓지 않아도 괜찮아요.',
];

// --- 상태 관리 ---
const state = {
    user: null,
    communityWorries: [],
    myWorries: [],
    currentPage: 'sea', // sea, inbox, outbox
};


// --- UI 렌더링 ---
const UIRenderer = {
    render() {
        if (!state.user) return; // 데이터 로드 전에는 렌더링하지 않음
        this.renderUserStatus();
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const currentPageEl = document.getElementById(`${state.currentPage}-page`);
        if (currentPageEl) { currentPageEl.classList.add('active'); }

        switch (state.currentPage) {
            case 'inbox': this.renderInbox(); break;
            case 'outbox': this.renderOutbox(); break;
            case 'sea': default: this.renderSea(); break;
        }
    },
    renderUserStatus() {
        document.getElementById('user-temp').textContent = `마음의 온도: ${state.user.temperature.toFixed(1)}℃`;
        document.getElementById('user-vouchers').textContent = `고민권: ${state.user.vouchers}개`;
        document.getElementById('show-worry-modal').disabled = state.user.vouchers <= 0;
    },
    renderSea() { /* 정적 컨텐츠 */ },
    renderInbox() {
        const container = document.getElementById('inbox-container');
        if(state.user.inbox.length === 0){
            container.innerHTML = '<p>아직 도착한 마음이 없어요.<br>바다에서 유리병을 주워보세요.</p>';
            return;
        }
        container.innerHTML = state.user.inbox.map(worry => {
            let statusText = '온기 보내기';
            if (worry.replied) {
                statusText = worry.myReplyWasAdopted ? '✨ 내 온기가 채택됐어요!' : '보낸 온기 확인';
            }
            return `
                <div class="bottle-card" data-action="view-worry" data-worry-id="${worry.id}">
                    <p class="worry-snippet">"${worry.text}"</p>
                    <span class="card-status">${statusText}</span>
                </div>
            `;
        }).join('');
    },
    renderOutbox() {
        const container = document.getElementById('outbox-container');
        if(state.myWorries.length === 0){
            container.innerHTML = '<p>아직 바다에 띄운 마음이 없어요.</p>';
            return;
        }
        container.innerHTML = state.myWorries.map(worry => `
            <div class="bottle-card" data-action="view-my-worry" data-worry-id="${worry.id}">
                <p class="worry-snippet">"${worry.text}"</p>
                <span class="card-status">${worry.replies.length}개의 온기 도착</span>
            </div>
        `).join('');
    },
    renderWorryDetail(worry, isEditing = false) {
        const container = document.getElementById('inbox-container');
        
        let contentHTML;
        if (isEditing) {
            contentHTML = `
                <form data-action="submit-edited-reply" data-worry-id="${worry.id}">
                    <textarea>${worry.myReply}</textarea>
                    <button type="submit" class="glowing-btn">수정 완료</button>
                </form>
            `;
        } else if (worry.replied && worry.myReply) {
            const adoptedBadge = worry.myReplyWasAdopted ? '<span class="adopted-badge">✨ 채택됨</span>' : '';
            contentHTML = `
                <div class="replies-section">
                    <div class="detail-actions-top">
                        <h4>내가 보낸 온기 ${adoptedBadge}</h4>
                        <div>
                            <button class="secondary-btn" data-action="edit-reply" data-worry-id="${worry.id}">수정</button>
                            <button class="danger-btn" data-action="delete-reply" data-worry-id="${worry.id}">삭제</button>
                        </div>
                    </div>
                    <div class="reply-card">
                        <p>${worry.myReply}</p>
                    </div>
                </div>
            `;
        } else {
            contentHTML = `
                <form data-action="submit-reply" data-worry-id="${worry.id}">
                    <textarea placeholder="따뜻한 마음을 답장으로 보내주세요..."></textarea>
                    <button type="submit" class="glowing-btn">온기 보내기</button>
                </form>
            `;
        }

        container.innerHTML = `
            <div class="bottle-detail">
                <button class="back-btn" data-action="back-to-inbox">&larr; 주운 유리병</button>
                <h3>${worry.author}의 이야기</h3>
                <p class="worry-full-text">${worry.text}</p>
                ${contentHTML}
            </div>
        `;
    },
    renderMyWorryDetail(worry) {
        const container = document.getElementById('outbox-container');
        const repliesHTML = worry.replies.map(reply => `
            <div class="reply-card ${reply.isAdopted ? 'adopted' : ''}">
                <p>"${reply.text}" - ${reply.author}</p>
                <div class="reply-actions">
                    <button class="adopt-btn" data-action="adopt-reply" data-worry-id="${worry.id}" data-reply-id="${reply.id}" ${reply.isAdopted ? 'disabled' : ''}>
                        ${reply.isAdopted ? '채택됨' : '채택하기'}
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="bottle-detail">
                <div class="detail-actions-top">
                    <button class="back-btn" data-action="back-to-outbox">&larr; 보낸 유리병</button>
                    <button class="danger-btn" data-action="delete-my-worry" data-worry-id="${worry.id}">유리병 깨뜨리기</button>
                </div>
                <h3>내가 보낸 이야기</h3>
                <p class="worry-full-text">${worry.text}</p>
                <div class="replies-section">
                    <h4>받은 온기들</h4>
                    ${repliesHTML || '<p>아직 온기가 도착하지 않았어요.</p>'} 
                </div>
            </div>
        `;
    }
};

// --- 애플리케이션 로직 ---
const App = {
    async init() {
        state.user = await api.getUser();
        state.communityWorries = await api.getCommunityWorries();
        state.myWorries = await api.getMyWorries();
        this.checkDailyVoucher();

        this.setupEventListeners();
        const hash = window.location.hash.replace('#', '');
        if (['sea', 'inbox', 'outbox'].includes(hash)) { state.currentPage = hash; }
        this.updateNav();
        UIRenderer.render();
    },

    checkDailyVoucher() {
        const today = new Date().toDateString();
        if (state.user.lastLoginDate !== today) {
            state.user.vouchers = Math.min(state.user.vouchers + 1, 5);
            state.user.lastLoginDate = today;
            api.saveUser(state.user);
        }
    },

    setupEventListeners() {
        document.querySelector('nav').addEventListener('click', e => {
            if (e.target.tagName === 'A') { this.navigate(e.target.hash.replace('#', '')); }
        });

        const modal = document.getElementById('worry-modal');
        document.getElementById('show-worry-modal').addEventListener('click', () => modal.style.display = 'flex');
        document.querySelector('.modal-close-btn').addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('send-worry-bottle').addEventListener('click', () => this.handleSendWorry());
        document.getElementById('get-bottle-from-sea').addEventListener('click', () => this.handleGetBottle());
        
        document.querySelector('main').addEventListener('click', e => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const worryId = target.dataset.worryId;
            const replyId = target.dataset.replyId;

            if (action === 'view-worry') this.handleViewWorry(worryId);
            if (action === 'view-my-worry') this.handleViewMyWorry(worryId);
            if (action === 'back-to-inbox') this.navigate('inbox');
            if (action === 'back-to-outbox') this.navigate('outbox');
            if (action === 'adopt-reply') this.handleAdoptReply(worryId, replyId);
            if (action === 'delete-my-worry') this.handleDeleteMyWorry(worryId);
            if (action === 'edit-reply') this.handleEditReply(worryId);
            if (action === 'delete-reply') this.handleDeleteReply(worryId);
        });
        
        document.querySelector('main').addEventListener('submit', e => {
            e.preventDefault();
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            const worryId = target.dataset.worryId;

            if (action === 'submit-reply') {
                const textarea = target.querySelector('textarea');
                this.handleSubmitReply(worryId, textarea.value);
            }
            if (action === 'submit-edited-reply') {
                const textarea = target.querySelector('textarea');
                this.handleSubmitEditedReply(worryId, textarea.value);
            }
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
            a.classList.toggle('active', a.hash.replace('#', '') === state.currentPage);
        });
    },
    
    handleViewWorry(worryId, isEditing = false) {
        const worry = state.user.inbox.find(w => w.id === worryId);
        if(worry) { UIRenderer.renderWorryDetail(worry, isEditing); }
    },
    
    handleViewMyWorry(worryId) {
        const worry = state.myWorries.find(w => w.id === worryId);
        if(worry) { UIRenderer.renderMyWorryDetail(worry); }
    },

    async handleSubmitReply(worryId, text) {
        text = text.trim();
        if (!text) { alert('따뜻한 마음을 나눠주세요.'); return; }
        
        const updatedWorry = await api.sendReply(worryId, text);
        
        const worryIndex = state.user.inbox.findIndex(w => w.id === worryId);
        if (worryIndex > -1) {
            state.user.inbox[worryIndex] = updatedWorry;
        }

        if (updatedWorry.myReplyWasAdopted) {
            state.user.vouchers++;
            state.user.temperature += 0.3;
            alert('당신의 따뜻한 온기가 채택되어 고민권 1개와 마음의 온도가 올랐습니다!');
        } else {
            alert('따뜻한 온기가 전달되었어요. (시뮬레이션)');
        }
        await api.saveUser(state.user);
        this.navigate('inbox');
    },

    handleEditReply(worryId) {
        this.handleViewWorry(worryId, true);
    },

    async handleSubmitEditedReply(worryId, newText) {
        newText = newText.trim();
        if (!newText) { alert('따뜻한 마음을 나눠주세요.'); return; }
        
        await api.editReply(worryId, newText);
        
        const worry = state.user.inbox.find(w => w.id === worryId);
        if(worry) worry.myReply = newText;
        
        alert('온기를 수정했습니다.');
        this.handleViewWorry(worryId, false);
    },

    async handleDeleteReply(worryId) {
        if (confirm('보낸 온기를 지우시겠어요?')) {
            await api.deleteReply(worryId);
            const worry = state.user.inbox.find(w => w.id === worryId);
            if (worry) {
                worry.replied = false;
                delete worry.myReply;
                delete worry.myReplyWasAdopted;
            }
            alert('보낸 온기를 지웠습니다.');
            this.handleViewWorry(worryId);
        }
    },
    
    async handleAdoptReply(worryId, replyIdToAdopt) {
        const worry = await api.adoptReply(worryId, replyIdToAdopt);
        
        const index = state.myWorries.findIndex(w => w.id === worryId);
        if (index > -1) {
            state.myWorries[index] = worry;
        }
        alert('가장 마음에 드는 온기를 채택했어요.');
        this.handleViewMyWorry(worryId);
    },

    async handleDeleteMyWorry(worryId) {
        if (confirm('정말로 이 유리병을 깨뜨리시겠어요? 사라진 이야기는 돌아오지 않아요.')) {
            await api.deleteWorry(worryId);
            state.myWorries = state.myWorries.filter(w => w.id !== worryId);
            alert('유리병을 깨뜨렸습니다.');
            this.navigate('outbox');
        }
    },
    
    async handleSendWorry() {
        const input = document.getElementById('worry-input');
        const text = input.value.trim();
        if (!text) { alert('이야기를 들려주세요.'); return; }
        if (state.user.vouchers <= 0) { alert('고민권이 부족해요.'); return; }

        state.user.vouchers--;
        const newWorry = { id: `my-${Date.now()}`, text, timestamp: new Date().toISOString(), replies: [] };
        
        await api.sendWorry(newWorry);
        state.myWorries.push(newWorry);
        await api.saveUser(state.user);
        
        input.value = '';
        document.getElementById('worry-modal').style.display = 'none';
        alert('당신의 마음을 바다에 띄워보냈어요.');
        this.navigate('outbox');
        
        setTimeout(() => this.simulateReply(newWorry.id), 5000);
    },

    async handleGetBottle() {
        const communityWorries = await api.getCommunityWorries();
        const unreadWorries = communityWorries.filter(w => !state.user.inbox.find(inboxWorry => inboxWorry.id === w.id));
        if (unreadWorries.length === 0) {
            alert('지금은 바다에 떠다니는 유리병이 없네요. 잠시 후에 다시 시도해주세요.');
            return;
        }
        const worry = unreadWorries[Math.floor(Math.random() * unreadWorries.length)];
        state.user.inbox.push(worry);
        await api.saveUser(state.user);
        alert('누군가의 마음이 담긴 유리병을 주웠어요. 받은 편지함에서 확인해보세요.');
        this.navigate('inbox');
    },

    async simulateReply(myWorryId) {
        const worry = state.myWorries.find(w => w.id === myWorryId);
        if (worry) {
            const replyText = PRE_WRITTEN_REPLIES[Math.floor(Math.random() * PRE_WRITTEN_REPLIES.length)];
            const newReply = { id: `sim-reply-${Date.now()}`, text: replyText, author: '어느 따뜻한 마음', isAdopted: false };
            worry.replies.push(newReply);
            await api.saveMyWorries(state.myWorries);
            if (state.currentPage === 'outbox') { UIRenderer.render(); }
            alert('내가 보낸 마음에 온기가 도착했어요!');
        }
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());