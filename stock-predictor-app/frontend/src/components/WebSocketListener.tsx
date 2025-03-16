import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast, Button, Box, Text, VStack, HStack, Badge, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton } from '@chakra-ui/react';

type NotificationType = 'recommendation_change' | 'price_alert' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  symbol: string;
  company: string;
  message: string;
  timestamp: string;
  read: boolean;
  details?: any;
}

interface WebSocketListenerProps {
  symbols?: string[];
  onNotification?: (notification: Notification) => void;
}

const WebSocketListener: React.FC<WebSocketListenerProps> = ({ 
  symbols = ["*"], // Varsayılan olarak tüm hisselere abone ol
  onNotification
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // WebSocket bağlantısını kur
  const connectWebSocket = useCallback(() => {
    // WebSocket sunucu URL'sini belirle
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Eğer tam URL belirtilmişse, protokolü değiştir
    let wsUrl;
    if (apiUrl.startsWith('http')) {
      wsUrl = apiUrl.replace(/^https?:/, protocol).replace(/\/api$/, '') + '/ws';
    } else {
      // Protokolü olmayan URL için
      wsUrl = `${protocol}//${apiUrl.replace(/\/api$/, '')}/ws`;
    }
    
    console.log('Connecting to WebSocket at:', wsUrl);
    
    // Bağlantıyı kur
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Belirtilen hisselere abone ol
      const subscriptionMessage = {
        action: 'subscribe',
        symbols: symbols
      };
      ws.send(JSON.stringify(subscriptionMessage));
      
      toast({
        title: 'Bildirim sistemi bağlandı',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right'
      });
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'subscription_success') {
          console.log(`Subscribed to: ${data.symbols.join(', ')}`);
        }
        else if (data.type === 'recommendation_change') {
          // Tavsiye değişikliği bildirimi
          const notification: Notification = {
            id: Date.now().toString(),
            type: 'recommendation_change',
            symbol: data.symbol,
            company: data.company,
            message: `${data.company} (${data.symbol}) için tavsiye ${data.old_recommendation || 'HOLD'} -> ${data.new_recommendation}`,
            timestamp: data.timestamp,
            read: false,
            details: data
          };
          
          handleNewNotification(notification);
        }
        else if (data.type === 'error') {
          console.error('WebSocket Error:', data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // 5 saniye sonra yeniden bağlanmayı dene
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
    
    wsRef.current = ws;
    
    // Komponent unmount olduğunda bağlantıyı kapat
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
          action: 'unsubscribe',
          symbols: symbols
        };
        ws.send(JSON.stringify(unsubscribeMessage));
        ws.close();
      }
    };
  }, [symbols, toast]);
  
  // Yeni bildirim geldiğinde işle
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Son 50 bildirimi tut
    setUnreadCount(prev => prev + 1);
    
    // Bildirimi toast olarak göster
    toast({
      title: getNotificationTitle(notification),
      description: notification.message,
      status: getNotificationStatus(notification),
      duration: 5000,
      isClosable: true,
      position: 'bottom-right'
    });
    
    // Callback fonksiyonu çağır
    if (onNotification) {
      onNotification(notification);
    }
  }, [onNotification, toast]);
  
  // Bildirimleri okundu olarak işaretle
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);
  
  // Bildirimi sil
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);
  
  // Bildirim tipine göre başlık belirle
  const getNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
      case 'recommendation_change':
        return `${notification.symbol} Tavsiye Değişikliği`;
      case 'price_alert':
        return `${notification.symbol} Fiyat Uyarısı`;
      case 'error':
        return 'Hata';
      case 'info':
      default:
        return 'Bilgi';
    }
  };
  
  // Bildirim tipine göre durum belirle
  const getNotificationStatus = (notification: Notification): 'info' | 'warning' | 'success' | 'error' => {
    switch (notification.type) {
      case 'recommendation_change':
        const details = notification.details;
        if (details && details.new_recommendation === 'BUY') return 'success';
        if (details && details.new_recommendation === 'SELL') return 'error';
        return 'info';
      case 'price_alert':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  };
  
  // WebSocket bağlantısını başlat
  useEffect(() => {
    connectWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Bildirim badge'i için stil
  const notificationBadgeStyle = {
    position: 'absolute' as const,
    top: '-8px',
    right: '-8px',
    borderRadius: 'full',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  return (
    <>
      <Box position="fixed" bottom="20px" right="20px" zIndex={10}>
        <Button 
          position="relative" 
          onClick={onOpen} 
          colorScheme="blue" 
          size="md" 
          borderRadius="full"
          boxShadow="lg"
        >
          <Text fontSize="xl">🔔</Text>
          {unreadCount > 0 && (
            <Box 
              bg="red.500" 
              color="white" 
              {...notificationBadgeStyle}
            >
              {unreadCount}
            </Box>
          )}
        </Button>
      </Box>
      
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            Bildirimler
            <HStack mt={2} spacing={2}>
              <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                Tümünü Okundu Say
              </Button>
              <Button size="sm" onClick={clearNotifications} disabled={notifications.length === 0}>
                Temizle
              </Button>
              <Badge 
                colorScheme={isConnected ? "green" : "red"} 
                variant="solid" 
                borderRadius="full" 
                px={2}
              >
                {isConnected ? "Bağlı" : "Bağlantı Kesildi"}
              </Badge>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            {notifications.length === 0 ? (
              <Text color="gray.500" textAlign="center" mt={10}>
                Henüz bildirim yok
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {notifications.map(notification => (
                  <Box 
                    key={notification.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                    bg={notification.read ? "white" : "blue.50"}
                    borderLeftWidth="4px"
                    borderLeftColor={
                      notification.type === 'recommendation_change' 
                        ? notification.details?.new_recommendation === 'BUY' 
                          ? "green.400" 
                          : notification.details?.new_recommendation === 'SELL' 
                            ? "red.400" 
                            : "blue.400"
                        : "blue.400"
                    }
                  >
                    <HStack justify="space-between" mb={1}>
                      <Badge colorScheme={getNotificationStatus(notification)}>
                        {notification.symbol}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Text>
                    </HStack>
                    <Text fontWeight={notification.read ? "normal" : "bold"}>
                      {notification.message}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default WebSocketListener; 