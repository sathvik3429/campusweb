// Campus Management System Chatbot with Voice Assistance
class CampusChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voiceEnabled = false;
        this.collegeData = {
            examDates: {
                'mid-semester': 'November 15-20, 2024',
                'end-semester': 'January 10-25, 2025',
                'practical': 'December 5-10, 2024',
                'project': 'January 5-15, 2025'
            },
            fees: {
                'tuition': '₹45,000 per semester',
                'hostel': '₹25,000 per semester',
                'mess': '₹15,000 per semester',
                'library': '₹2,000 per semester',
                'sports': '₹1,500 per semester',
                'total': '₹88,500 per semester'
            },
            academicCalendar: {
                'semester_start': 'August 1, 2024',
                'semester_end': 'January 31, 2025',
                'holidays': ['October 2', 'November 14', 'December 25', 'January 26'],
                'breaks': {
                    'puja_break': 'October 15-20, 2024',
                    'winter_break': 'December 20-31, 2024'
                }
            },
            departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
            contactInfo: {
                'admissions': '+91-98765-43210',
                'academics': '+91-98765-43211',
                'hostel': '+91-98765-43212',
                'transport': '+91-98765-43213'
            }
        };
        this.init();
    }

    init() {
        this.createChatInterface();
        this.loadWelcomeMessage();
        this.setupEventListeners();
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        // Check if we're on HTTPS or Localhost (required for voice recognition)
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

        if (!isSecure) {
            console.warn('Voice recognition requires HTTPS or Localhost connection');
            return;
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('Voice recognition started');
                    this.isListening = true;
                    this.updateVoiceButton();
                };

                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('Voice recognized:', transcript);
                    document.getElementById('chat-input').value = transcript;
                    this.isListening = false;
                    this.updateVoiceButton();

                    // Auto-send the message after voice input
                    setTimeout(() => {
                        this.sendMessage();
                    }, 500);
                };

                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.isListening = false;
                    this.updateVoiceButton();

                    // Show error message to user
                    let errorMessage = 'Voice recognition error: ';
                    switch (event.error) {
                        case 'no-speech':
                            errorMessage += 'No speech detected. Please try again.';
                            break;
                        case 'audio-capture':
                            errorMessage += 'No microphone found. Please check your microphone.';
                            break;
                        case 'not-allowed':
                            errorMessage += 'Microphone permission denied. Please allow microphone access.';
                            break;
                        default:
                            errorMessage += event.error;
                    }
                    this.addMessage(errorMessage, 'bot');
                };

                this.recognition.onend = () => {
                    console.log('Voice recognition ended');
                    this.isListening = false;
                    this.updateVoiceButton();
                };

                console.log('Voice recognition initialized successfully');
            } catch (error) {
                console.error('Failed to initialize speech recognition:', error);
            }
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    createChatInterface() {
        const chatHTML = `
            <div id="chatbot-container" class="chatbot-container hidden">
                <div class="chatbot-header" id="chatbot-header">
                    <div class="chatbot-title">
                        <img src="robo.png" alt="Chatbot Robot" class="chatbot-icon" />
                        <span>Campus Assistant</span>
                    </div>
                    <div class="chatbot-controls">
                        <button class="voice-btn" id="voice-btn" title="Voice Input">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                        </button>
                        <button class="minimize-btn" id="minimize-btn">−</button>
                        <button class="close-btn" id="close-btn">×</button>
                    </div>
                </div>
                
                <div class="chatbot-body" id="chatbot-body">
                    <div class="chat-messages" id="chat-messages">
                        <!-- Messages will be added here -->
                    </div>
                    
                    <div class="chat-input-container" id="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Type your message or use voice..." maxlength="500">
                        <button id="send-btn" class="send-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="chatbot-toggle" id="chatbot-toggle">
                <img src="robo.png" alt="Chatbot Robot" class="chatbot-icon" />
                <span>Need Help?</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
        this.addChatbotStyles();
    }

    addChatbotStyles() {
        const styles = `
            <style>
                .chatbot-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 380px;
                    height: 550px;
                    background: rgba(16, 24, 39, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    opacity: 1;
                    visibility: visible;
                }

                .chatbot-container.hidden {
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(40px) scale(0.9);
                    pointer-events: none;
                }

                .chatbot-container.minimized {
                    height: 70px;
                    border-radius: 35px;
                }

                .chatbot-header {
                    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
                    padding: 18px 25px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }

                .chatbot-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #fff;
                    font-weight: 700;
                    font-size: 16px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .chatbot-icon {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    background: #fff;
                    padding: 2px;
                    object-fit: cover;
                }

                .chatbot-controls {
                    display: flex;
                    gap: 8px;
                }

                .voice-btn, .minimize-btn, .close-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .voice-btn:hover, .minimize-btn:hover, .close-btn:hover {
                    background: rgba(255, 255, 255, 0.4);
                    transform: scale(1.1);
                }

                .voice-btn.listening {
                    background: #ff4757;
                    animation: pulse-red 1.5s infinite;
                }

                .chatbot-body {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: transparent;
                    min-height: 0;
                }

                .chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    scroll-behavior: smooth;
                }
                
                /* Custom Scrollbar for Chat */
                .chat-messages::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                }

                .message {
                    max-width: 85%;
                    padding: 12px 18px;
                    border-radius: 20px;
                    font-size: 14px;
                    line-height: 1.5;
                    animation: messageSlide 0.4s ease;
                    position: relative;
                }

                .message.user {
                    background: linear-gradient(135deg, #00c6ff, #0072ff);
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3);
                }

                .message.bot {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: #fff;
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                    backdrop-filter: blur(5px);
                }

                .message.quick-reply {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(79, 172, 254, 0.3);
                    color: #4facfe;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-align: center;
                    border-radius: 12px;
                }

                .message.quick-reply:hover {
                    background: rgba(79, 172, 254, 0.2);
                    border-color: #4facfe;
                    transform: translateY(-2px);
                }

                .chat-input-container {
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                }

                #chat-input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    padding: 12px 18px;
                    border-radius: 25px;
                    outline: none;
                    font-size: 14px;
                    transition: all 0.3s;
                    max-height: 100px;
                }

                #chat-input:focus {
                    border-color: #4facfe;
                    background: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 0 15px rgba(79, 172, 254, 0.2);
                }

                .send-btn {
                    background: #4facfe;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 45px;
                    height: 45px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    box-shadow: 0 0 15px rgba(79, 172, 254, 0.4);
                }

                .send-btn:hover {
                    transform: scale(1.1) rotate(-10deg);
                    background: #00f2fe;
                }

                /* Typing Indicator */
                .typing-indicator {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 12px 18px;
                    border-radius: 20px;
                    border-bottom-left-radius: 4px;
                    display: flex;
                    gap: 5px;
                    align-self: flex-start;
                }

                .typing-dot {
                    width: 6px;
                    height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                    opacity: 0.6;
                }

                @keyframes typing {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                /* Toggle Button */
                .chatbot-toggle {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: linear-gradient(135deg, #00c6ff, #0072ff);
                    color: white;
                    padding: 16px 24px;
                    border-radius: 50px;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(0, 114, 255, 0.5);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 9998;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .chatbot-toggle:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 15px 35px rgba(0, 114, 255, 0.6);
                }

                .chatbot-toggle span {
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .quick-replies-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 15px;
                }

                .quick-reply-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(79, 172, 254, 0.3);
                    color: #fff;
                    border-radius: 20px;
                    padding: 8px 16px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .quick-reply-btn:hover {
                    background: rgba(79, 172, 254, 0.2);
                    border-color: #4facfe;
                    box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
                }

                @keyframes messageSlide {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        // Toggle button
        const toggle = document.getElementById('chatbot-toggle');
        toggle.addEventListener('click', () => this.toggleChat());

        // Header click to toggle minimize
        const header = document.getElementById('chatbot-header');
        header.addEventListener('click', (e) => {
            if (!e.target.closest('.chatbot-controls')) {
                this.toggleMinimize();
            }
        });

        // Minimize button
        const minimizeBtn = document.getElementById('minimize-btn');
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        // Close button
        const closeBtn = document.getElementById('close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideChat();
        });

        // Voice button
        const voiceBtn = document.getElementById('voice-btn');
        voiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVoiceInput();
        });

        // Send button
        const sendBtn = document.getElementById('send-btn');
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Input field
        const input = document.getElementById('chat-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        input.addEventListener('input', () => this.autoResizeInput());
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.addMessage("🎤 Voice input is not supported in your browser. Please use Chrome or Edge for voice features.", 'bot');
            return;
        }

        // Check HTTPS requirement
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecure) {
            this.addMessage("🔒 Voice input requires HTTPS connection. Please access the site via HTTPS.", 'bot');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        } else {
            try {
                this.recognition.start();
                this.addMessage("🎤 Listening... Please speak now!", 'bot');
            } catch (error) {
                console.error('Error starting voice recognition:', error);
                this.addMessage("❌ Error starting voice recognition. Please try again.", 'bot');
            }
        }
        this.updateVoiceButton();
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-btn');
        if (this.isListening) {
            voiceBtn.classList.add('listening');
            voiceBtn.title = 'Listening... Click to stop';
        } else {
            voiceBtn.classList.remove('listening');
            voiceBtn.title = 'Voice Input';
        }
    }

    speakText(text) {
        if (this.synthesis && this.voiceEnabled) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    autoResizeInput() {
        const input = document.getElementById('chat-input');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    }

    loadWelcomeMessage() {
        const welcomeMessage = this.getWelcomeMessage();
        this.addMessage(welcomeMessage, 'bot');
        this.addQuickReplies();
    }

    getWelcomeMessage() {
        return `🎓 **Welcome to JITS Campus Assistant!** 🎓

I'm here to help you with all campus-related information and tasks.

**What can I help you with today?**

📚 **Academic Information**
📅 **Exam Dates & Calendar**
💰 **Fee Structure**
📞 **Contact Information**
🎤 **Voice Commands Available**

Just ask me anything or use the quick reply buttons below!`;
    }

    addQuickReplies() {
        const quickReplies = [
            '📚 Exam Dates',
            '💰 Fee Structure',
            '📅 Academic Calendar',
            '📞 Contact Info',
            '🎤 Voice Commands',
            '❓ General Help'
        ];

        const container = document.createElement('div');
        container.className = 'quick-replies-container';

        quickReplies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.textContent = reply;
            button.addEventListener('click', () => this.handleQuickReply(reply));
            container.appendChild(button);
        });

        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.appendChild(container);
    }

    addMessage(text, type = 'user') {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;

        messagesContainer.appendChild(messageDiv);
        this.messages.push({ text, type, timestamp: new Date() });

        this.scrollToBottom();

        // Speak bot messages if voice is enabled
        if (type === 'bot') {
            this.speakText(text);
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        // Process message and get response
        const response = await this.processMessage(message);

        // Hide typing indicator and show response
        this.hideTypingIndicator();
        this.addMessage(response, 'bot');

        // Focus back on input and ensure it's visible
        setTimeout(() => {
            input.focus();
            this.ensureInputVisible();
        }, 100);
    }

    ensureInputVisible() {
        const input = document.getElementById('chat-input');
        const inputContainer = document.getElementById('chat-input-container');

        // Ensure input container is visible
        inputContainer.style.display = 'flex';
        inputContainer.style.visibility = 'visible';
        inputContainer.style.opacity = '1';

        // Focus and scroll to input if needed
        input.focus();

        // Scroll to bottom to ensure input is visible
        this.scrollToBottom();
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // College-specific information
        if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
            return this.getExamDatesResponse();
        } else if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('cost')) {
            return this.getFeeStructureResponse();
        } else if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('academic')) {
            return this.getAcademicCalendarResponse();
        } else if (lowerMessage.includes('department') || lowerMessage.includes('course')) {
            return this.getDepartmentResponse();
        } else if (lowerMessage.includes('voice') || lowerMessage.includes('speak') || lowerMessage.includes('audio')) {
            return this.getVoiceCommandsResponse();
        } else if (lowerMessage.includes('attendance') || lowerMessage.includes('mark')) {
            return this.getAttendanceResponse();
        } else if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
            return this.getLoginResponse();
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
            return this.getHelpResponse();
        } else if (lowerMessage.includes('contact')) {
            return this.getContactResponse();
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! How can I help you with JITS campus information today?";
        } else {
            return this.getDefaultResponse();
        }
    }

    getExamDatesResponse() {
        const examInfo = this.collegeData.examDates;
        return `📚 **Exam Schedule - JITS Campus**

**Mid-Semester Exams:** ${examInfo['mid-semester']}
**End-Semester Exams:** ${examInfo['end-semester']}
**Practical Exams:** ${examInfo['practical']}
**Project Submissions:** ${examInfo['project']}

**Important Notes:**
• All exams start at 9:00 AM
• Bring your ID card and necessary stationery
• Check your specific timetable on the notice board
• Contact your department for any clarifications

Need more specific information about any exam?`;
    }

    getFeeStructureResponse() {
        const fees = this.collegeData.fees;
        return `💰 **Fee Structure - JITS Campus**

**Breakdown:**
• Tuition Fee: ${fees.tuition}
• Hostel Fee: ${fees.hostel}
• Mess Fee: ${fees.mess}
• Library Fee: ${fees.library}
• Sports Fee: ${fees.sports}

**Total Semester Fee: ${fees.total}**

**Payment Options:**
• Online payment through student portal
• Bank transfer to college account
• Cash payment at accounts office

**Due Dates:**
• First installment: August 15, 2024
• Second installment: October 15, 2024

Need help with payment process?`;
    }

    getAcademicCalendarResponse() {
        const calendar = this.collegeData.academicCalendar;
        return `📅 **Academic Calendar 2024-25**

**Semester Period:**
• Start Date: ${calendar.semester_start}
• End Date: ${calendar.semester_end}

**Important Breaks:**
• Puja Break: ${calendar.breaks.puja_break}
• Winter Break: ${calendar.breaks.winter_break}

**Holidays:**
• ${calendar.holidays.join(', ')}

**Key Dates:**
• Registration Deadline: July 25, 2024
• Course Add/Drop: August 5-10, 2024
• Mid-Semester: November 15-20, 2024
• End-Semester: January 10-25, 2025

Need specific date information?`;
    }

    getDepartmentResponse() {
        const departments = this.collegeData.departments;
        return `🏛️ **JITS Departments**

**Available Departments:**
• ${departments.join('\n• ')}

**Department Contacts:**
• Computer Science: ${this.collegeData.contactInfo.academics}
• Electronics: ${this.collegeData.contactInfo.academics}
• Mechanical: ${this.collegeData.contactInfo.academics}
• Civil: ${this.collegeData.contactInfo.academics}
• Electrical: ${this.collegeData.contactInfo.academics}

**Office Hours:** 9:00 AM - 5:00 PM (Mon-Fri)

Which department would you like to know more about?`;
    }

    getVoiceCommandsResponse() {
        return `🎤 **Voice Commands Available**

**How to use voice input:**
1. Click the microphone button in the chat
2. Speak your question clearly
3. Wait for the response

**Voice Command Examples:**
• "What are the exam dates?"
• "Tell me about fees"
• "Show academic calendar"
• "Contact information"
• "Department details"

**Voice Output:**
• Bot responses are automatically spoken
• You can disable voice output if needed

**Tips for better voice recognition:**
• Speak clearly and at normal pace
• Minimize background noise
• Use simple, direct questions

Try saying "What are the exam dates?" using voice input!`;
    }

    getAttendanceResponse() {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));

        if (user && user.role === 'Teacher') {
            return "As a teacher, you can mark attendance by:\n1. Going to your dashboard\n2. Selecting a class section\n3. Toggling student attendance\n4. Clicking 'Submit Attendance'\n\nNeed help with anything specific?";
        } else if (user && user.role === 'Student') {
            return "Students can view their attendance records in their dashboard. Teachers mark attendance during classes. If you notice any discrepancies, please contact your teacher or HOD.";
        } else {
            return "To mark attendance:\n1. Login as a teacher\n2. Access the teacher dashboard\n3. Select your class section\n4. Mark students present/absent\n5. Submit the attendance\n\nNote: Student login has been removed from the system.";
        }
    }

    getLoginResponse() {
        return "To login to the system:\n1. Go to the login page\n2. Enter your ID\n3. Enter your 4-digit PIN\n4. Click 'Login'\n\nIf you're having trouble, make sure your credentials are correct or contact support.";
    }

    getHelpResponse() {
        return `🎓 **JITS Campus Assistant Help**

**What I can help you with:**

📚 **Academic Information**
• Exam dates and schedules
• Course information
• Department details

💰 **Financial Information**
• Fee structure and breakdown
• Payment methods
• Due dates

📅 **Calendar & Events**
• Academic calendar
• Holiday schedule
• Important dates

📞 **Contact & Support**
• Department contacts
• Office hours
• Emergency contacts

🎤 **Voice Features**
• Voice input for questions
• Audio responses
• Hands-free operation

**Quick Commands:**
• "Exam dates" - Get exam schedule
• "Fees" - View fee structure
• "Calendar" - Academic calendar
• "Contact" - Department contacts
• "Voice help" - Voice commands guide

What specific help do you need?`;
    }

    getContactResponse() {
        return `📞 **JITS Campus Contact Information**

**General Inquiries:**
• Admissions: ${this.collegeData.contactInfo.admissions}
• Academics: ${this.collegeData.contactInfo.academics}
• Hostel: ${this.collegeData.contactInfo.hostel}
• Transport: ${this.collegeData.contactInfo.transport}

**Office Hours:**
• Monday - Friday: 9:00 AM - 5:00 PM
• Saturday: 9:00 AM - 1:00 PM
• Sunday: Closed

**Emergency Contacts:**
• Campus Security: +91-98765-43214
• Medical Emergency: +91-98765-43215

**Email:**
• General: info@jits.edu
• Admissions: admissions@jits.edu
• Support: support@jits.edu

For urgent issues, please contact your department head directly.`;
    }

    getDefaultResponse() {
        const responses = [
            "I'm here to help with JITS campus information. You can ask me about exam dates, fees, academic calendar, or general campus support.",
            "I'm not sure I understood that. Try asking about exam dates, fees, academic calendar, or contact information.",
            "I'm your JITS campus assistant! I can help with academic information, fees, calendar, and general support.",
            "Feel free to ask me about:\n• 📚 Exam dates and schedules\n• 💰 Fee structure and payments\n• 📅 Academic calendar\n• 📞 Contact information\n• 🎤 Voice commands"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    handleQuickReply(text) {
        // Remove all quick reply messages
        const quickReplies = document.querySelectorAll('.message.quick-reply');
        quickReplies.forEach(reply => reply.remove());

        // Remove quick reply buttons
        const quickReplyContainers = document.querySelectorAll('.quick-replies-container');
        quickReplyContainers.forEach(container => container.remove());

        // Process the quick reply
        this.addMessage(text, 'user');
        this.processMessage(text).then(response => {
            this.addMessage(response, 'bot');
        });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    toggleChat() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');

        console.log('Current state:', this.isOpen);

        if (this.isOpen) {
            this.hideChat();
        } else {
            this.showChat();
        }
    }

    showChat() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');

        container.classList.remove('hidden');
        toggle.classList.add('hidden');
        this.isOpen = true;

        // Focus on input after showing chat
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            input.focus();
        }, 300);

        console.log('Chat shown');
    }

    toggleMinimize() {
        const container = document.getElementById('chatbot-container');
        container.classList.toggle('minimized');
        console.log('Minimize toggled');
    }

    hideChat() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');

        container.classList.add('hidden');
        toggle.classList.remove('hidden');
        this.isOpen = false;

        console.log('Chat hidden');
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing enhanced chatbot with voice features...');
    window.campusChatbot = new CampusChatbot();
    console.log('Enhanced chatbot initialized');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampusChatbot;
} 