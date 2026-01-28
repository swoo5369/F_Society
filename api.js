'use strict';

// --- Mock API Service ---
// 이 파일은 백엔드 API를 시뮬레이션합니다.
// 모든 함수는 실제 네트워크처럼 작동하도록 Promise를 반환합니다.
// 현재는 localStorage를 사용하지만, 나중에 실제 fetch/WebSocket 코드로 교체할 수 있습니다.

const api = {
    // --- USER DATA ---
    async getUser() {
        const userJSON = localStorage.getItem('bottle_user');
        if (userJSON) {
            return JSON.parse(userJSON);
        }
        const newUser = {
            temperature: 36.5, vouchers: 1, lastLoginDate: new Date().toDateString(),
            unlockedSkins: ['default'], inbox: [],
        };
        await this.saveUser(newUser);
        return newUser;
    },
    async saveUser(user) {
        localStorage.setItem('bottle_user', JSON.stringify(user));
        return Promise.resolve();
    },

    // --- WORRY DATA ---
    async getCommunityWorries() {
        const worriesJSON = localStorage.getItem('bottle_community_worries');
        // SEED_WORRIES는 main.js에서 전역으로 접근 가능
        if (!worriesJSON) {
             localStorage.setItem('bottle_community_worries', JSON.stringify(SEED_WORRIES));
             return SEED_WORRIES;
        }
        return JSON.parse(worriesJSON);
    },
    async getMyWorries() {
        const worriesJSON = localStorage.getItem('bottle_my_worries');
        return worriesJSON ? JSON.parse(worriesJSON) : [];
    },
    async saveMyWorries(worries) {
        localStorage.setItem('bottle_my_worries', JSON.stringify(worries));
        return Promise.resolve();
    },

    // --- ACTIONS ---
    async sendWorry(worry) {
        const myWorries = await this.getMyWorries();
        myWorries.push(worry);
        await this.saveMyWorries(myWorries);
        return worry;
    },

    async sendReply(worryId, replyText) {
        const user = await this.getUser();
        const worry = user.inbox.find(w => w.id === worryId);
        if (worry) {
            worry.replied = true;
            worry.myReply = replyText;
            if (Math.random() < 0.5) {
                worry.myReplyWasAdopted = true;
            }
            await this.saveUser(user);
        }
        return worry;
    },
    
    async editReply(worryId, newText) {
        const user = await this.getUser();
        const worry = user.inbox.find(w => w.id === worryId);
        if (worry) {
            worry.myReply = newText;
            await this.saveUser(user);
        }
        return worry;
    },

    async deleteReply(worryId) {
        const user = await this.getUser();
        const worry = user.inbox.find(w => w.id === worryId);
        if (worry) {
            worry.replied = false;
            delete worry.myReply;
            delete worry.myReplyWasAdopted;
            await this.saveUser(user);
        }
        return worry;
    },

    async deleteWorry(worryId) {
        let myWorries = await this.getMyWorries();
        myWorries = myWorries.filter(w => w.id !== worryId);
        await this.saveMyWorries(myWorries);
        return worryId;
    },
    
    async adoptReply(worryId, replyId) {
        let myWorries = await this.getMyWorries();
        const worry = myWorries.find(w => w.id === worryId);
        if(worry) {
            worry.replies.forEach(r => r.isAdopted = false);
            const reply = worry.replies.find(r => r.id === replyId);
            if(reply) {
                reply.isAdopted = true;
                await this.saveMyWorries(myWorries);
            }
        }
        return worry;
    },
};
