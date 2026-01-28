// 1. 미리 준비된 위로의 메시지 배열
const comfortingMessages = [
    "그랬군요. 정말 힘드셨겠어요. 당신의 마음을 온전히 이해할 수는 없지만, 진심으로 위로를 전합니다.",
    "이야기해주셔서 고마워요. 그 용기만으로도 당신은 이미 강한 사람이에요.",
    "괜찮아요. 모든 것이 괜찮아질 거예요. 지금 이 순간의 감정들도 자연스러운 과정의 일부랍니다.",
    "당신은 혼자가 아니에요. 보이지 않는 곳에서도 많은 사람들이 당신을 응원하고 있다는 걸 잊지 마세요.",
    "오늘 하루도 정말 고생 많으셨어요. 따뜻한 차 한 잔과 함께 잠시 쉬어가세요.",
    "결과가 어떻든, 당신이 쏟은 노력과 시간은 절대 배신하지 않아요. 그 자체로 이미 빛나는 경험이에요.",
    "하늘의 별처럼, 당신은 그 자체로 소중하고 반짝이는 존재입니다.",
    "지금 느끼는 감정들을 충분히 느끼고 흘려보내 주세요. 억지로 괜찮은 척하지 않아도 괜찮아요.",
    "당신의 잘못이 아니에요. 누구에게나 힘든 날은 찾아오기 마련이니까요. 스스로를 너무 자책하지 마세요.",
    "따뜻한 이불 속에 들어온 것처럼, 이 글이 당신에게 작은 안식처가 되었으면 좋겠습니다."
];

// 2. 웹 컴포넌트 정의: <worry-card>
class WorryCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.querySelector('.capture-btn').addEventListener('click', () => this.captureCard());
    }

    set content({ worry, reply }) {
        this.worry = worry;
        this.reply = reply;
    }

    captureCard() {
        // html2canvas를 사용하여 shadowRoot 내부의 특정 요소를 캡처합니다.
        const cardContent = this.shadowRoot.querySelector('.card-content');
        html2canvas(cardContent, {
            backgroundColor: '#16213e', // 카드의 배경색과 동일하게 설정
            useCORS: true
        }).then(canvas => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = '마음의_온도_답장.png';
            link.click();
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                }
                .card-content {
                    background-color: var(--card-bg-color, #16213e);
                    border-left: 5px solid var(--primary-color, #e94560);
                    border-radius: 10px;
                    padding: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    opacity: 0;
                    transform: translateY(20px);
                    animation: fadeIn 0.8s forwards;
                    font-family: var(--font-family, 'Nanum Myeongjo', serif);
                    color: var(--text-color, #dcdcdc);
                }
                .worry-content {
                    font-style: italic;
                    color: #b0b0b0;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px dashed #4a4a68;
                    line-height: 1.8;
                }
                .reply-content {
                    font-size: 1.1rem;
                    line-height: 1.8;
                }
                .card-footer {
                    margin-top: 20px;
                    text-align: right;
                }
                .capture-btn {
                    background: none;
                    border: 1px solid var(--secondary-color, #f0e5d8);
                    color: var(--secondary-color, #f0e5d8);
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: var(--font-family, 'Nanum Myeongjo', serif);
                    transition: background-color 0.3s, color 0.3s;
                }
                .capture-btn:hover {
                    background-color: var(--secondary-color, #f0e5d8);
                    color: var(--card-bg-color, #16213e);
                }
                @keyframes fadeIn {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
            <div class="card-content">
                <p class="worry-content">"${this.worry}"</p>
                <p class="reply-content">${this.reply}</p>
                <div class="card-footer">
                    <button class="capture-btn">이미지로 저장</button>
                </div>
            </div>
        `;
    }
}
customElements.define('worry-card', WorryCard);


// 3. DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {
    const worryInput = document.getElementById('worry-input');
    const submitWorryBtn = document.getElementById('submit-worry');
    const lettersContainer = document.getElementById('letters-container');

    // 4. '온기 보내기' 버튼 클릭 이벤트
    submitWorryBtn.addEventListener('click', () => {
        const worryText = worryInput.value.trim();

        if (worryText) {
            // 5. 랜덤 답장 선택 및 카드 생성
            const randomReply = comfortingMessages[Math.floor(Math.random() * comfortingMessages.length)];
            
            const newCard = document.createElement('worry-card');
            newCard.content = {
                worry: worryText,
                reply: randomReply
            };
            
            // 새로운 카드를 맨 위에 추가
            lettersContainer.prepend(newCard);

            // 입력창 초기화
            worryInput.value = '';

            // 부드럽게 스크롤
            newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } else {
            alert("당신의 이야기를 들려주세요.");
        }
    });
});