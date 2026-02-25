import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Plus, Send, Trash2, Hash, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL?.replace('/api', '') ?? '');

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdByName?: string;
  createdAt: string;
  messageCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  general: 'Allgemein',
  team: 'Team',
  client: 'Mandant',
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  team: 'bg-green-100 text-green-700',
  client: 'bg-purple-100 text-purple-700',
};

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load rooms
  const loadRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get<ChatRoom[]>('/chat/rooms');
      setRooms(res.data);
      if (res.data.length > 0 && !selectedRoom) {
        setSelectedRoom(res.data[0]);
      }
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedRoom]);

  // Load messages for selected room
  const loadMessages = useCallback(async (roomId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages?limit=100`);
      setMessages(res.data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
    }
  }, [selectedRoom, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket for real-time chat
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(`${WS_URL}/ws`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit('join', { userId: user.id, tenantId: user.tenantId });
    });

    socket.on('chat:message', (data: { roomId: string; message: ChatMessage }) => {
      // Update rooms list with latest message preview
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.roomId
            ? {
                ...r,
                messageCount: r.messageCount + 1,
                lastMessageAt: data.message.createdAt,
                lastMessagePreview:
                  data.message.content.length > 60 ? data.message.content.slice(0, 60) + '…' : data.message.content,
              }
            : r,
        ),
      );
      // Add message if in the current room
      setSelectedRoom((room) => {
        if (room?.id === data.roomId) {
          setMessages((prev) => {
            // Avoid duplicates (we already added our own message optimistically)
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
        return room;
      });
    });

    socket.on('chat:message_deleted', (data: { roomId: string; messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, user?.tenantId]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedRoom || sending) return;
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    try {
      // Optimistic update
      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        roomId: selectedRoom.id,
        userId: user!.id,
        userName: user!.name,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const res = await api.post<ChatMessage>(`/chat/rooms/${selectedRoom.id}/messages`, { content });
      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? res.data : m)));
    } catch {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedRoom) return;
    try {
      await api.delete(`/chat/rooms/${selectedRoom.id}/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      // ignore
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreatingRoom(true);
    try {
      const res = await api.post<ChatRoom>('/chat/rooms', {
        name: newRoomName.trim(),
        description: newRoomDesc.trim() || undefined,
        type: newRoomType,
      });
      setRooms((prev) => [...prev, res.data]);
      setSelectedRoom(res.data);
      setShowNewRoom(false);
      setNewRoomName('');
      setNewRoomDesc('');
      setNewRoomType('general');
    } catch {
      // ignore
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Raum wirklich löschen? Alle Nachrichten werden gelöscht.')) return;
    try {
      await api.delete(`/chat/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoom?.id === roomId) {
        const remaining = rooms.filter((r) => r.id !== roomId);
        setSelectedRoom(remaining[0] ?? null);
      }
    } catch {
      // ignore
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return (
      d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="space-y-0 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Team-Chat
          </h1>
          <p className="text-muted-foreground mt-1">Kommunikation in Echtzeit mit dem gesamten Team</p>
        </div>
      </div>

      <div className="flex h-[calc(100%-5rem)] gap-4">
        {/* Sidebar: Room List */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <Button size="sm" className="w-full justify-start" onClick={() => setShowNewRoom(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Raum
          </Button>

          {/* New room form */}
          {showNewRoom && (
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-semibold">Raum erstellen</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowNewRoom(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <input
                  type="text"
                  placeholder="Name *"
                  className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
                <input
                  type="text"
                  placeholder="Beschreibung"
                  className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                />
                <select
                  className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                >
                  <option value="general">Allgemein</option>
                  <option value="team">Team</option>
                  <option value="client">Mandant</option>
                </select>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={handleCreateRoom}
                  disabled={creatingRoom || !newRoomName.trim()}
                >
                  <Check className="w-3 h-3 mr-1" />
                  {creatingRoom ? 'Erstellen…' : 'Erstellen'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rooms */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {loadingRooms ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Noch keine Räume.</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className={`group flex items-start gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <Hash className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">{room.name}</span>
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded font-medium shrink-0 ${
                          selectedRoom?.id === room.id
                            ? 'bg-white/20 text-white'
                            : (ROOM_TYPE_COLORS[room.type] ?? 'bg-gray-100 text-gray-600')
                        }`}
                      >
                        {ROOM_TYPE_LABELS[room.type] ?? room.type}
                      </span>
                    </div>
                    {room.lastMessagePreview && (
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          selectedRoom?.id === room.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {room.lastMessagePreview}
                      </p>
                    )}
                  </div>
                  <button
                    className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                      selectedRoom?.id === room.id
                        ? 'text-primary-foreground/70 hover:text-primary-foreground'
                        : 'text-muted-foreground hover:text-destructive'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          {selectedRoom ? (
            <>
              {/* Room Header */}
              <CardHeader className="border-b py-3 px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">{selectedRoom.name}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${ROOM_TYPE_COLORS[selectedRoom.type] ?? ''}`}>
                    {ROOM_TYPE_LABELS[selectedRoom.type] ?? selectedRoom.type}
                  </Badge>
                  {selectedRoom.description && (
                    <span className="text-xs text-muted-foreground">— {selectedRoom.description}</span>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Noch keine Nachrichten. Schreiben Sie die erste!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.userId === user?.id;
                    return (
                      <div key={msg.id} className={`flex items-start gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {msg.userName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-2 mb-1">
                            {!isOwn && <span className="text-xs font-semibold text-foreground">{msg.userName}</span>}
                            <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                            {isOwn && (
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm break-words ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="border-t p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Nachricht an #${selectedRoom.name}…`}
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    className="rounded-full shrink-0"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Wählen Sie einen Chat-Raum aus oder erstellen Sie einen neuen.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
