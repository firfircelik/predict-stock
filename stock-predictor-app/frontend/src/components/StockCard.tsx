import { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  StatArrow, 
  Flex, 
  Badge, 
  Button,
  useDisclosure,
  Collapse,
  Link,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { StockPrediction, NewsHeadline } from '@/types';
import type { RecommendationType, SentimentExplanationType } from '@/types';
import StockChart from './StockChart';

// Recommendation colors
const RECOMMENDATION_COLORS: Record<RecommendationType, string> = {
  'BUY': 'green.500',
  'SELL': 'red.500',
  'HOLD': 'yellow.500'
};

// Recommendation icons
const RECOMMENDATION_ICONS: Record<RecommendationType, string> = {
  'BUY': '📈',
  'SELL': '📉',
  'HOLD': '📊'
};

// Sentiment colors
const SENTIMENT_COLORS: Record<SentimentExplanationType, string> = {
  'Very Positive': 'green.600',
  'Positive': 'green.400',
  'Neutral': 'blue.400',
  'Negative': 'orange.400',
  'Very Negative': 'red.500',
  'No data': 'gray.400'
};

interface StockCardProps {
  prediction: StockPrediction;
}

export default function StockCard({ prediction }: StockCardProps) {
  const { isOpen: isChartOpen, onToggle: onChartToggle } = useDisclosure();
  const { isOpen: isNewsOpen, onToggle: onNewsToggle } = useDisclosure();
  
  if (prediction.error) {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="lg" 
        boxShadow="md" 
        bg="white"
        borderColor="red.300"
      >
        <Heading size="md">{prediction.symbol}</Heading>
        <Text color="red.500" mt={2}>{prediction.error}</Text>
      </Box>
    );
  }
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };
  
  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'percent', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(percent / 100);
  };
  
  const renderRecommendation = (rec: RecommendationType) => {
    const color = RECOMMENDATION_COLORS[rec];
    const icon = RECOMMENDATION_ICONS[rec];
    
    return (
      <Badge 
        colorScheme={color.split('.')[0]} 
        fontSize="md" 
        py={1} 
        px={3} 
        borderRadius="full"
      >
        {icon} {rec}
      </Badge>
    );
  };
  
  const renderSentiment = () => {
    const sentimentExplanation = prediction.sentiment_explanation as SentimentExplanationType;
    const color = SENTIMENT_COLORS[sentimentExplanation];
    
    return (
      <Text color={color} fontWeight="medium">
        {prediction.sentiment_explanation}
      </Text>
    );
  };
  
  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      boxShadow="md" 
      bg="white"
      position="relative"
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Heading size="md">{prediction.symbol}</Heading>
          <Text color="gray.600" fontSize="sm">{prediction.company_name}</Text>
        </Box>
        {renderRecommendation(prediction.final_recommendation)}
      </Flex>
      
      <Flex 
        wrap="wrap" 
        justify="space-between" 
        gap={4}
      >
        <Stat>
          <StatLabel>Son Fiyat</StatLabel>
          <StatNumber>{formatMoney(prediction.last_price)}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Tahmin Edilen</StatLabel>
          <StatNumber>{formatMoney(prediction.prediction)}</StatNumber>
          <StatHelpText>
            <StatArrow type={prediction.change >= 0 ? 'increase' : 'decrease'} />
            {formatPercent(prediction.change)}
          </StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Duygu Analizi</StatLabel>
          <StatNumber>{renderSentiment()}</StatNumber>
          <StatHelpText fontSize="xs">
            Haberlere göre analiz
          </StatHelpText>
        </Stat>
      </Flex>
      
      {/* Recommendations section */}
      <Box mt={4} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200" bg="gray.50">
        <Heading size="xs" mb={2}>Tavsiyeler</Heading>
        <HStack spacing={4} wrap="wrap">
          <Flex align="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">Fiyat:</Text>
            {renderRecommendation(prediction.price_recommendation)}
          </Flex>
          <Flex align="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">Haber:</Text>
            {renderRecommendation(prediction.sentiment_recommendation)}
          </Flex>
          <Flex align="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold">Sonuç:</Text>
            {renderRecommendation(prediction.final_recommendation)}
          </Flex>
        </HStack>
      </Box>
      
      <Box mt={4}>
        <Button 
          size="sm" 
          onClick={onNewsToggle} 
          variant="outline"
          colorScheme="teal"
          width="100%"
          mb={2}
        >
          {isNewsOpen ? 'Haberleri Gizle' : 'Haberleri Göster'}
        </Button>
        
        <Collapse in={isNewsOpen} animateOpacity>
          <Box mt={2} mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200">
            <Heading size="xs" mb={2}>Son Haberler</Heading>
            {prediction.top_headlines && prediction.top_headlines.length > 0 ? (
              <VStack align="stretch" spacing={2}>
                {prediction.top_headlines.map((headline, index) => (
                  <Box key={index} p={2} bg="gray.50" borderRadius="md">
                    <Link href={headline.url} isExternal color="blue.500" fontWeight="medium">
                      {headline.headline} <ExternalLinkIcon mx="2px" />
                    </Link>
                    <Flex justify="space-between" fontSize="xs" color="gray.500" mt={1}>
                      <Text>{headline.source}</Text>
                      <Text>{headline.date}</Text>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Bu hisse için haber bulunamadı.
              </Text>
            )}
          </Box>
        </Collapse>
        
        <Button 
          size="sm" 
          onClick={onChartToggle} 
          variant="outline"
          colorScheme="blue"
          width="100%"
        >
          {isChartOpen ? 'Grafiği Gizle' : 'Grafiği Göster'}
        </Button>
      </Box>
      
      <Collapse in={isChartOpen} animateOpacity>
        <Box mt={4} height="300px">
          <StockChart prediction={prediction} />
        </Box>
      </Collapse>
    </Box>
  );
} 