export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  parentMessageId: string | null;
}

export interface StoredChat {
  id: string;
  title: string;
  messages: StoredMessage[];
  currentLeafMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'simple-chat-history';

class LocalStorageService {
  private static instance: LocalStorageService;

  private constructor() {}

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  getAllChats(): StoredChat[] {
    if (!this.isClient()) return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading chats from localStorage:', error);
      return [];
    }
  }

  getChat(chatId: string): StoredChat | null {
    const chats = this.getAllChats();
    return chats.find(chat => chat.id === chatId) || null;
  }

  saveChat(chat: StoredChat): void {
    if (!this.isClient()) return;

    try {
      const chats = this.getAllChats();
      const index = chats.findIndex(c => c.id === chat.id);
      
      if (index >= 0) {
        chats[index] = { ...chat, updatedAt: new Date().toISOString() };
      } else {
        chats.push(chat);
      }

      chats.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chat to localStorage:', error);
    }
  }

  deleteChat(chatId: string): void {
    if (!this.isClient()) return;

    try {
      const chats = this.getAllChats();
      const filtered = chats.filter(chat => chat.id !== chatId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting chat from localStorage:', error);
    }
  }

  createChat(title?: string): StoredChat {
    const now = new Date().toISOString();
    const chat: StoredChat = {
      id: crypto.randomUUID(),
      title: title || 'New Chat',
      messages: [],
      currentLeafMessageId: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.saveChat(chat);
    return chat;
  }

  updateChatTitle(chatId: string, title: string): void {
    const chat = this.getChat(chatId);
    if (chat) {
      chat.title = title;
      this.saveChat(chat);
    }
  }

  addMessage(chatId: string, message: StoredMessage): void {
    const chat = this.getChat(chatId);
    if (chat) {
      chat.messages.push(message);
      chat.currentLeafMessageId = message.id;
      this.saveChat(chat);
    }
  }

  getActiveBranch(chatId: string): StoredMessage[] {
    const chat = this.getChat(chatId);
    if (!chat || !chat.currentLeafMessageId) return [];
    
    const messagesMap = new Map(chat.messages.map(m => [m.id, m]));
    const branch: StoredMessage[] = [];
    
    let currentId: string | null = chat.currentLeafMessageId;
    while (currentId) {
      const message = messagesMap.get(currentId);
      if (!message) break;
      branch.unshift(message);
      currentId = message.parentMessageId;
    }
    
    return branch;
  }

  getSiblings(chatId: string, messageId: string): { siblings: StoredMessage[]; currentIndex: number } {
    const chat = this.getChat(chatId);
    if (!chat) return { siblings: [], currentIndex: 0 };
    
    const message = chat.messages.find(m => m.id === messageId);
    if (!message) return { siblings: [], currentIndex: 0 };
    
    const siblings = chat.messages
      .filter(m => m.parentMessageId === message.parentMessageId && m.role === message.role)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const currentIndex = siblings.findIndex(m => m.id === messageId);
    
    return { siblings, currentIndex };
  }

  switchToSibling(chatId: string, messageId: string, direction: 'prev' | 'next'): void {
    const chat = this.getChat(chatId);
    if (!chat) return;
    
    const { siblings, currentIndex } = this.getSiblings(chatId, messageId);
    
    if (siblings.length === 0) return;
    
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= siblings.length) return;
    
    const newMessage = siblings[newIndex];
    
    // Follow down to the deepest leaf from this sibling and save
    const leafId = this.findDeepestLeaf(chat, newMessage.id);
    chat.currentLeafMessageId = leafId;
    
    this.saveChat(chat);
  }

  private findDeepestLeaf(chat: StoredChat, messageId: string): string {
    let currentId = messageId;
    let children = chat.messages.filter(m => m.parentMessageId === currentId);
    
    // Follow the longest/deepest path
    while (children.length > 0) {
      // Sort children by creation date and pick the first (oldest)
      children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      currentId = children[0].id;
      children = chat.messages.filter(m => m.parentMessageId === currentId);
    }
    
    return currentId;
  }

  private switchToLeafFromMessage(chatId: string, messageId: string): void {
    const chat = this.getChat(chatId);
    if (!chat) return;
    
    const leafId = this.findDeepestLeaf(chat, messageId);
    chat.currentLeafMessageId = leafId;
  }

  generateTitle(firstMessage: string): string {
    const words = firstMessage.trim().split(/\s+/).slice(0, 6);
    const title = words.join(' ');
    return title.length < firstMessage.length ? `${title}...` : title;
  }
}

export const chatStorage = LocalStorageService.getInstance();

