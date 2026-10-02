import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { signUp, signIn, signOut, getProfile, updateProfile, logSurveyCompletion, logWithdrawal, updateWithdrawalStatus } from '@/lib/auth';
import { initiateSTK, pollSTKStatus } from '@/lib/mpesa';
import type { User } from '@supabase/supabase-js';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Gift,
  HelpCircle,
  Home,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
  UserRound,
  CircleDollarSign,
  AlertTriangle,
  Smartphone,
  TrendingUp,
  LogOut,
  FileText,
  Users,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import hero from '@/assets/kenya-community.jpg';
import connectivity from '@/assets/survey-connectivity.jpg';
import finance from '@/assets/survey-finance.jpg';
import lifestyle from '@/assets/survey-lifestyle.jpg';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Survey Pay Kenya — Consumer Research & Community Insights' },
      { name: 'description', content: 'Participate in consumer surveys and community opinion panels across Kenya. Share feedback on everyday products, local services, and consumer experiences.' },
      { property: 'og:title', content: 'Survey Pay Kenya — Consumer Research & Community Insights' },
      { property: 'og:description', content: 'Participate in consumer surveys and community opinion panels across Kenya. Share feedback on everyday products and local services.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

type View = 'landing' | 'home' | 'surveys' | 'wallet' | 'profile';
type Modal = 'activation' | 'survey' | 'unlock' | 'upgrade' | 'withdraw' | 'locked' | 'run_out_free' | 'auth' | 'terms' | 'privacy' | 'disclaimer' | 'contact' | null;

interface Question {
  question: string;
  options: string[];
}

interface Survey {
  id: number;
  company: string;
  topic: string;
  category: string;
  time: string;
  image: string;
  initials: string;
  tone: string;
  logo?: string;
  locked?: boolean;
  potential: number;
  potentialDaily: string;
  questions: Question[];
}

const brandLogos = {
  mpesa: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpPW44zGPlwLz40oLqcVyugEk_7UWeNhvIoKeLMkPZQHKue3WLVEE_1Dc&s=10',
  equity: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3lI_U7pV4a9P2pJ29Cip0395sRwTiNHUOPxbgchHF1Kb7Yq0iQWW5PJg&s=10',
  kcb: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6WkhJHmPEnr9FtyVvpfHco0lHHP6Uu3Wj20EHZZruCg&s=10',
  safaricom: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgYswe-a-aOFttqR47XCqRk3p4VC3w5XJagX8Dz9eeTg&s=10',
  jumia: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuIlqkVWFIP9AvAfC6SouPmqMcfNv6VCZKUQawGe22JQ&s=10',
  naivas: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQNvvaLblqb7rkGDon4kKvH9ZMuwbetSLjJNzT78_lzg&s=10',
  airtel: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbF9GiWzRri0juvRNG9leyvsGfvj4kcVuz-JYlsBthNpSSN7xrQdNnK8k&s=10',
  kenyaairways: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrxeCR0VYCAkVW3bENGSEGcM08x4Aevm7lHVZQsoZ4_g&s=10',
  bolt: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRmfHzstAd3vjzhuJNXR0zet0pyOBABWJRHIvo7B8sjdtgvazTmzHoTpTf&s=10',
  carrefour: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe22Sqmb_beA5ntGFMocWqPJwoVtcaAWH8GgEPUQmfBksFqLBvIt1wk4Ae&s=10',
  quickmart: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDovLc2Ni-aiXOYeAlrokqM3LJR3LJCGQyfdLlP0tqMrweZgFfWnkZkYDe&s=10',
  ncba: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/NCBA_Bank_Kenya_logo.svg/320px-NCBA_Bank_Kenya_logo.svg.png',
  showmax: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Showmax_Logo_2024.svg/320px-Showmax_Logo_2024.svg.png',
  glovo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Glovo_logo.svg/320px-Glovo_logo.svg.png',
  javahouse: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6sN8G5vFw9-dFw0R4kC8jJz8f5QfX1X8W6w&s=10',
  kplc: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Kenya_Power_and_Lighting_Company_logo.svg/320px-Kenya_Power_and_Lighting_Company_logo.svg.png',
  totalenergies: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/TotalEnergies_logo.svg/320px-TotalEnergies_logo.svg.png',
  bamburi: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3Vf-R4Jd4p7uYk9c8_vN7v8Vz1P9x4Vz1Pw&s=10',
  starlink: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Starlink_Logo.svg/320px-Starlink_Logo.svg.png',
  uber: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/320px-Uber_logo_2018.png',
  dstv: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/DStv_Logo_2012.svg/320px-DStv_Logo_2012.svg.png',
  rubis: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Logo_Rubis_2019.svg/320px-Logo_Rubis_2019.svg.png',
  standardchartered: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Standard_Chartered_%282021%29.svg/320px-Standard_Chartered_%282021%29.svg.png',
  shell: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/320px-Shell_logo.svg.png',
  britam: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/79/Britam_Holdings_logo.svg/320px-Britam_Holdings_logo.svg.png',
  crownpaints: 'https://crownpaints.co.ke/wp-content/uploads/2021/04/Crown-Paints-Logo.png',
  absa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Absa_Group_Logo.svg/320px-Absa_Group_Logo.svg.png',
  coop: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Co-operative_Bank_of_Kenya_Logo.svg/320px-Co-operative_Bank_of_Kenya_Logo.svg.png',
  serena: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Serena_Hotels_Logo.svg/320px-Serena_Hotels_Logo.svg.png',
  emirates: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/320px-Emirates_logo.svg.png',
};

const surveyData: Survey[] = [
  // --- FREE SURVEYS (Surveys 1 to 14) ---
  {
    id: 1,
    company: 'Safaricom',
    topic: 'Your digital life, your way',
    category: 'Technology',
    time: '4 min',
    image: brandLogos.safaricom,
    initials: 'S',
    tone: 'green',
    logo: brandLogos.safaricom,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How often do you use mobile data in a typical day?', options: ['Several times a day', 'Once a day', 'A few times a week', 'Rarely'] },
      { question: 'What matters most when choosing a mobile data plan?', options: ['Affordable bundles', 'Reliable 4G/5G coverage', 'Fast browsing speeds', 'Flexible validity options'] },
      { question: 'Which mobile service do you rely on most in Kenya?', options: ['M-Pesa transactions', 'Voice calls & SMS', 'Mobile data & WhatsApp', 'Entertainment & TikTok'] },
      { question: 'How satisfied are you with customer care support?', options: ['Extremely satisfied', 'Satisfied', 'Neutral', 'Needs improvement'] },
      { question: 'What new feature would you love to see on MySafaricom App?', options: ['Data sharing without fees', 'Custom bundle creator', 'Instant offline payments', 'Discount voucher store'] },
    ],
  },
  {
    id: 2,
    company: 'Equity Bank',
    topic: 'Banking that moves with you',
    category: 'Finance',
    time: '5 min',
    image: brandLogos.equity,
    initials: 'E',
    tone: 'red',
    logo: brandLogos.equity,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How do you prefer to manage your everyday banking?', options: ['Equity Mobile App', 'USSD code (*247#)', 'Equity Agent in my neighbourhood', 'In-branch counter'] },
      { question: 'What is most important to you in a banking app?', options: ['Ease of use & speed', 'High security & biometric login', 'Zero/low transfer fees', 'Quick customer support'] },
      { question: 'How often do you check your account balance?', options: ['Multiple times daily', 'Once every couple of days', 'Weekly', 'Only when expecting money'] },
      { question: 'Have you used an Equity agent or ATM in the past month?', options: ['Yes, Equity Agent', 'Yes, ATM', 'Both Agent & ATM', 'Neither, fully digital'] },
      { question: 'What loan or digital credit product interests you most?', options: ['EazzyLoan mobile credit', 'Business booster financing', 'Education/school fees loan', 'Personal emergency fund'] },
    ],
  },
  {
    id: 3,
    company: 'KCB Bank',
    topic: 'The future of everyday payments',
    category: 'Finance',
    time: '4 min',
    image: brandLogos.kcb,
    initials: 'K',
    tone: 'blue',
    logo: brandLogos.kcb,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How do you most often pay for everyday purchases?', options: ['M-Pesa Buy Goods/Paybill', 'KCB debit card tap', 'Cash in hand', 'Bank app transfer'] },
      { question: 'What would make digital payments easier for you?', options: ['Zero transaction fees', 'Universal QR code acceptance', 'Offline payment verification', 'Instant cashbacks'] },
      { question: 'Where do you make most of your daily payments?', options: ['Supermarkets & retail shops', 'Online & food delivery', 'Public transport & fuel', 'Utility bills (water, KPLC)'] },
      { question: 'Have you used KCB M-Pesa loans in the last 6 months?', options: ['Frequently', 'Occasionally', 'Tried once', 'Never'] },
      { question: 'What feature would improve your banking confidence?', options: ['Instant SMS notifications', 'Card freeze toggle in app', 'Dedicated account manager', 'Free financial budgeting advice'] },
    ],
  },
  {
    id: 4,
    company: 'Naivas Supermarket',
    topic: 'Your shopping favourites & grocery habits',
    category: 'Lifestyle',
    time: '3 min',
    image: brandLogos.naivas,
    initials: 'N',
    tone: 'orange',
    logo: brandLogos.naivas,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What do you look for first when grocery shopping at Naivas?', options: ['Fresh produce & bakery', 'Everyday low prices', 'Variety & brand choices', 'Cleanliness & aisle space'] },
      { question: 'How often do you shop for household groceries?', options: ['Daily quick stops', '2 to 3 times a week', 'Once a week big shop', 'Monthly bulk shopping'] },
      { question: 'Do you actively collect and redeem Naivas Loyalty points?', options: ['Yes, every single time', 'Sometimes when I remember', 'Registered but rarely redeem', 'Not registered'] },
      { question: 'Which payment option do you find fastest at checkout?', options: ['M-Pesa till number', 'Debit/Credit card tap', 'Cash', 'Naivas gift card'] },
      { question: 'What service would make your supermarket experience better?', options: ['Self-checkout kiosks', 'Speedy home delivery app', 'More weekend discount offers', 'Wider ready-to-eat deli menu'] },
    ],
  },
  {
    id: 5,
    company: 'Airtel Kenya',
    topic: 'Staying connected with affordable bundles',
    category: 'Technology',
    time: '4 min',
    image: brandLogos.airtel,
    initials: 'A',
    tone: 'red',
    logo: brandLogos.airtel,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What do you value most from your network provider?', options: ['Affordable data bundles', 'Network coverage in rural areas', 'Voice call clarity', 'Airtel Money zero fees'] },
      { question: 'How often do you buy Airtel Tubonge or data bundles?', options: ['Daily', 'Weekly bundle', 'Monthly unlimited', 'As needed when on the move'] },
      { question: 'How do you usually communicate with friends & workmates?', options: ['WhatsApp & messaging apps', 'Direct voice phone calls', 'Social media (Instagram/X)', 'Video conferencing (Zoom/Teams)'] },
      { question: 'Have you used Airtel Money to pay merchants or transfer cash?', options: ['Yes, regularly', 'Occasionally', 'Tried once', 'No, strictly M-Pesa'] },
      { question: 'What would motivate you to make Airtel your primary SIM card?', options: ['Even cheaper gigabytes', 'Stronger 5G coverage everywhere', 'Free calls to all networks', 'Cash rewards on airtime top-ups'] },
    ],
  },
  {
    id: 6,
    company: 'Jumia Kenya',
    topic: 'The way you shop online in Kenya',
    category: 'Lifestyle',
    time: '5 min',
    image: brandLogos.jumia,
    initials: 'J',
    tone: 'orange',
    logo: brandLogos.jumia,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How often do you browse or buy products online?', options: ['Weekly', 'Monthly', 'During big sales (Black Friday)', 'Rarely or never'] },
      { question: 'What influences your decision to order on Jumia most?', options: ['Customer reviews & ratings', 'Discounted deals & flash sales', 'Speed & cost of delivery', 'Genuine brand authenticity'] },
      { question: 'Which product categories do you browse most frequently?', options: ['Smartphones & tech accessories', 'Fashion, shoes & clothes', 'Home appliances & kitchen', 'Beauty, perfumes & health'] },
      { question: 'Which delivery location do you prefer for Jumia packages?', options: ['Doorstep home delivery', 'Office/workplace address', 'Nearby Jumia pickup station', 'No preference'] },
      { question: 'What would make you shop online more frequently?', options: ['Completely free returns', 'Guaranteed same-day delivery', 'Cash on delivery everywhere', 'Direct price matching with local shops'] },
    ],
  },
  {
    id: 7,
    company: 'Kenya Airways',
    topic: 'Domestic & regional air travel perspectives',
    category: 'Travel',
    time: '4 min',
    image: brandLogos.kenyaairways,
    initials: 'KQ',
    tone: 'blue',
    logo: brandLogos.kenyaairways,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What matters most to you when booking a domestic or regional flight?', options: ['Ticket price & deals', 'On-time departure record', 'Baggage allowance policy', 'Convenient flight timings'] },
      { question: 'How do you prefer to book your flight tickets?', options: ['KQ Official Website / App', 'Online travel aggregator', 'Travel agent', 'Airport ticketing desk'] },
      { question: 'How often do you travel by air for business or leisure?', options: ['Multiple times a year', 'Once or twice a year', 'Every few years', 'Planning my first flight'] },
      { question: 'Which Kenyan coastal or lake destination do you fly to most?', options: ['Mombasa (MIA)', 'Kisumu (KIA)', 'Malindi / Diani', 'Eldoret'] },
      { question: 'What in-flight service makes a trip memorable for you?', options: ['Warm Kenyan hospitality', 'Comfortable seating & legroom', 'Quality snacks & beverages', 'Smooth baggage retrieval'] },
    ],
  },
  {
    id: 8,
    company: 'Bolt Kenya',
    topic: 'Getting around Nairobi & urban cities',
    category: 'Travel',
    time: '3 min',
    image: brandLogos.bolt,
    initials: 'B',
    tone: 'green',
    logo: brandLogos.bolt,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What is most important in choosing a ride-hailing app?', options: ['Affordable fares & discounts', 'Fast pickup in under 3 minutes', 'Safety features & driver vetting', 'Clean & air-conditioned vehicle'] },
      { question: 'When do you use ride-hailing services most often?', options: ['Daily work commute', 'Late evening / weekend outings', 'Airport & bus terminal runs', 'During heavy rainy days'] },
      { question: 'Which ride option do you choose most frequently?', options: ['Standard car (Economy/Comfort)', 'Boda boda (motorcycle)', 'Boda delivery service', 'Tuk-tuk (where available)'] },
      { question: 'How do you prefer to settle your ride fare?', options: ['M-Pesa direct to driver', 'In-app linked M-Pesa/card', 'Cash', 'Bolt credit'] },
      { question: 'What safety improvement would give you the most peace of mind?', options: ['In-app SOS emergency button', 'Audio trip recording', 'Mandatory two-way driver selfie verification', 'Share live trip link with family'] },
    ],
  },
  {
    id: 9,
    company: 'Carrefour Kenya',
    topic: 'What makes a great hypermarket experience',
    category: 'Lifestyle',
    time: '4 min',
    image: brandLogos.carrefour,
    initials: 'C',
    tone: 'blue',
    logo: brandLogos.carrefour,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'Which store section do you visit first at Carrefour?', options: ['Fresh bakery & rotisserie chicken', 'Electronics & gadgets', 'Household cleaners & detergents', 'Imported pantry goods & spices'] },
      { question: 'What makes you choose Carrefour over other supermarkets?', options: ['Unbeatable bulk deal pricing', 'Massive variety of goods', 'MyCLUB loyalty points discount', 'Comfortable parking & spacious aisles'] },
      { question: 'Do you use the Carrefour MyCLUB app to scan points?', options: ['Yes, every shopping visit', 'Only when spending large amounts', 'Registered but forget my phone', 'Not yet registered'] },
      { question: 'Have you purchased Carrefour Bio or in-house private brand products?', options: ['Yes, high quality and cheaper', 'Sometimes', 'Heard of them but hesitant', 'Never tried'] },
      { question: 'How do you rate the checkout speed during weekend peak hours?', options: ['Very fast & efficient', 'Acceptable wait time', 'A bit slow, queues get long', 'Needs more cashier counters'] },
    ],
  },
  {
    id: 10,
    company: 'Quickmart Kenya',
    topic: 'Fresh deli, bakery & fast neighbourhood shopping',
    category: 'Lifestyle',
    time: '3 min',
    image: brandLogos.quickmart,
    initials: 'Q',
    tone: 'green',
    logo: brandLogos.quickmart,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What is your favourite thing about Quickmart supermarket?', options: ['Fresh hot deli (roast chicken & chips)', 'Fresh bakery & doughnuts', 'Convenient 24/7 locations', 'Friendly store attendants'] },
      { question: 'How often do you pop into a neighbourhood Quickmart store?', options: ['Daily on my way home', 'A few times a week', 'Once weekly', 'Rarely or when travelling'] },
      { question: 'What hot meal or bakery snack do you buy most often?', options: ['Grilled chicken & wedges', 'Fresh bread & cakes', 'Samosas & sausages', 'Fresh fruit salads & juice'] },
      { question: 'Do you prefer paying via M-Pesa Till or debit card?', options: ['M-Pesa Till number', 'Card contactless tap', 'Cash notes', 'Mobile banking app'] },
      { question: 'What would improve your local Quickmart experience?', options: ['Larger parking lot', 'Express basket-only counters', 'Online order pickup window', 'More discounts on staples'] },
    ],
  },
  {
    id: 11,
    company: 'NCBA Bank',
    topic: 'Money goals, digital hustle & modern savings',
    category: 'Finance',
    time: '5 min',
    image: brandLogos.ncba,
    initials: 'N',
    tone: 'blue',
    logo: brandLogos.ncba,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What is your primary financial priority this year?', options: ['Growing my emergency savings', 'Expanding my business/side-hustle', 'Investing in land or money markets', 'Paying off debts & loans'] },
      { question: 'How do you track your personal income and expenses?', options: ['Mobile banking app analytics', 'Dedicated notebook / diary', 'Excel / Google spreadsheet', 'Mental estimate only'] },
      { question: 'Have you used digital credit like M-Shwari or NCBA Loop?', options: ['Yes, use regularly for working capital', 'Used occasionally in emergencies', 'Heard about it but never applied', 'No, avoid digital loans'] },
      { question: 'What feature makes you trust a financial institution most?', options: ['Clear, transparent interest rates', 'Decades of stability & reputation', 'Seamless digital tools without branch visits', 'Friendly customer service'] },
      { question: 'What digital banking service would you use most if available free?', options: ['Automated recurring savings pot', 'Zero-fee bank-to-M-Pesa transfers', 'Free credit score report', 'Micro-investment in Treasury bills'] },
    ],
  },
  {
    id: 12,
    company: 'Showmax Kenya',
    topic: 'Entertainment streaming & live football passion',
    category: 'Entertainment',
    time: '4 min',
    image: brandLogos.showmax,
    initials: 'S',
    tone: 'purple',
    logo: brandLogos.showmax,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'What content do you stream most often on subscription apps?', options: ['English Premier League & live sports', 'Local Kenyan drama series & reality TV', 'Hollywood blockbuster movies', 'Documentaries & true crime'] },
      { question: 'What device do you primarily use for watching movies or shows?', options: ['Smartphone on mobile data/Wi-Fi', 'Smart TV in living room', 'Laptop or tablet', 'Shared with family members'] },
      { question: 'What influences your decision to subscribe to a streaming service?', options: ['Live football match availability', 'Affordable monthly subscription price', 'Local Kenyan language content', 'Downloadable offline viewing'] },
      { question: 'How do you prefer to pay for your entertainment subscriptions?', options: ['M-Pesa auto-renew', 'M-Pesa manual monthly paybill', 'Debit / credit card', 'Telco airtime bundle integration'] },
      { question: 'What would keep you subscribed without pausing between months?', options: ['Exclusive local Kenyan shows every week', 'Lower bundle price combined with mobile data', '4K video streaming quality', 'Zero buffering on slow connections'] },
    ],
  },
  {
    id: 13,
    company: 'Glovo Kenya',
    topic: 'Food delivery & quick parcel errands in the city',
    category: 'Lifestyle',
    time: '4 min',
    image: brandLogos.glovo,
    initials: 'G',
    tone: 'orange',
    logo: brandLogos.glovo,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How often do you order food or groceries through delivery apps?', options: ['Multiple times a week', 'Once a week as a weekend treat', 'Once or twice a month', 'Only for emergency items'] },
      { question: 'What type of food do you order most frequently on delivery?', options: ['Burgers, pizza & fast food', 'Local Kenyan dishes (nyama choma, ugali)', 'Swahili / Indian biryani & curries', 'Healthy salads & smoothie bowls'] },
      { question: 'What is the most critical factor when choosing what to order?', options: ['Estimated delivery speed', 'Overall meal price & discounts', 'Restaurant ratings and customer reviews', 'Affordable delivery fee'] },
      { question: 'Have you used Glovo "Anything" courier feature to send an errand/parcel?', options: ['Yes, to send keys/documents', 'Yes, to buy pharmacy medicine', 'Heard of it but not used', 'No, only order cooked food'] },
      { question: 'What delivery fee do you consider reasonable for quick 30-min delivery?', options: ['Under KSh 50', 'KSh 50 - KSh 100', 'KSh 100 - KSh 150', 'Over KSh 150 if very fast'] },
    ],
  },
  {
    id: 14,
    company: 'Java House',
    topic: 'Coffee culture, casual meetings & all-day dining',
    category: 'Lifestyle',
    time: '4 min',
    image: brandLogos.javahouse,
    initials: 'JH',
    tone: 'green',
    logo: brandLogos.javahouse,
    locked: false,
    potential: 150,
    potentialDaily: 'KSh 1,500/day',
    questions: [
      { question: 'How often do you visit casual coffee shops or dine out?', options: ['Weekly for work meetings or leisure', 'A few times a month', 'Occasionally on special occasions', 'Rarely, prefer home cooking'] },
      { question: 'What is your signature go-to item at Java House?', options: ['Original Java House brewed coffee / latte', 'Classic beef burger & seasoned fries', 'Hearty breakfast combo with pancakes', 'Signature milkshakes & dessert cakes'] },
      { question: 'For what primary purpose do you visit Java House branches?', options: ['Remote working & business meetings', 'Catching up with close friends', 'Family weekend breakfast/lunch', 'Quick takeaway coffee on the go'] },
      { question: 'What matters most in a restaurant environment for you?', options: ['Reliable high-speed Wi-Fi & power sockets', 'Consistent food taste and generous portions', 'Courteous & quick table service', 'Calm and ambient music atmosphere'] },
      { question: 'Would you use a mobile app to pre-order and collect takeaway without waiting?', options: ['Definitely, saves busy morning time', 'Probably, if there is a discount', 'Prefer ordering at the counter', 'Not interested in app pre-ordering'] },
    ],
  },

  // --- LOCKED / PREMIUM SURVEYS (Surveys 15 to 34) ---
  {
    id: 15,
    company: 'Safaricom Home Fibre',
    topic: 'High-speed broadband, 5G & connected smart home',
    category: 'Technology',
    time: '5 min',
    image: brandLogos.safaricom,
    initials: 'S',
    tone: 'green',
    logo: brandLogos.safaricom,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'What kind of internet connectivity does your household rely on?', options: ['Safaricom Home Fibre cable', '4G/5G home Wi-Fi router', 'Mobile hotspot on phone', 'No fixed home internet connection'] },
      { question: 'What is your household average monthly spend on internet access?', options: ['Under KSh 1,500', 'KSh 1,500 - KSh 3,000', 'KSh 3,000 - KSh 5,000', 'Over KSh 5,000'] },
      { question: 'What internet activity requires the most bandwidth in your home?', options: ['Multiple family members streaming video', 'Remote work, Zoom calls & cloud storage', 'Online multiplayer gaming', 'Social media scrolling & downloads'] },
      { question: 'How many smart devices connect to your Wi-Fi router concurrently?', options: ['1 to 3 devices', '4 to 7 devices', '8 or more smart gadgets', 'Only my personal phone'] },
      { question: 'What would motivate you to upgrade to a faster fibre package?', options: ['Guaranteed zero buffering at peak hours', 'Bundled free mobile data & SMS', 'Free smart TV streaming device included', 'Lower monthly renewal pricing'] },
    ],
  },
  {
    id: 16,
    company: 'Equity EazzyFX & Wealth',
    topic: 'Foreign currency exchange & global wealth building',
    category: 'Finance',
    time: '5 min',
    image: brandLogos.equity,
    initials: 'E',
    tone: 'red',
    logo: brandLogos.equity,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'Have you ever bought or held foreign currencies (USD, GBP, EUR)?', options: ['Yes, for business imports/exports', 'Yes, for personal savings & travel', 'Planning to open a multi-currency account', 'Never held foreign currency'] },
      { question: 'Which investment vehicle are you most eager to explore this year?', options: ['Government Treasury bills & bonds', 'Money Market Funds (MMF)', 'Nairobi Securities Exchange (NSE) stocks', 'Real estate and agricultural land'] },
      { question: 'Where do you feel your long-term wealth is most secure in Kenya?', options: ['Commercial bank fixed deposit / MMF', 'Regulated SACCO shares & dividends', 'Physical land and rental properties', 'Private businesses and gold'] },
      { question: 'How often do you receive international remittances from relatives abroad?', options: ['Monthly regular support', 'A few times every year', 'Rarely or during holidays', 'Never receive remittances'] },
      { question: 'What digital tool would best assist your wealth journey?', options: ['Real-time foreign exchange rate converter', 'Automated micro-investing from spare change', 'Expert financial planner consultation', 'Tax-free interest savings calculator'] },
    ],
  },
  {
    id: 17,
    company: 'KCB SME Growth',
    topic: 'Small business hustle, till financing & merchant tools',
    category: 'Finance',
    time: '6 min',
    image: brandLogos.kcb,
    initials: 'K',
    tone: 'blue',
    logo: brandLogos.kcb,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'Do you operate a business, side hustle, or freelance trade in Kenya?', options: ['Yes, registered full-time business', 'Yes, informal side hustle alongside job', 'Planning to launch within 6 months', 'No, purely formal employment'] },
      { question: 'How do you primarily receive payments from your customers?', options: ['Lipa na M-Pesa Buy Goods Till', 'M-Pesa Send Money / Personal number', 'Bank account transfer / Cheque', 'Cash in hand'] },
      { question: 'What is the number one obstacle preventing your hustle from scaling?', options: ['Lack of affordable working capital', 'Customer acquisition and marketing', 'Late payments and cash flow gaps', 'Licensing, permits and regulatory taxes'] },
      { question: 'Have you ever applied for an unsecured mobile SME loan?', options: ['Yes, approved and paid back on time', 'Yes, but interest rate was too high', 'Applied but got rejected due to credit limit', 'Never applied for a business loan'] },
      { question: 'What banking product would accelerate your business hustle most?', options: ['Instant overdraft on merchant Till transactions', 'Free business bank account with no ledger fees', 'Electronic invoicing and receipt maker', 'Discounted point-of-sale (POS) card machine'] },
    ],
  },
  {
    id: 18,
    company: 'M-Pesa Global & Fuliza',
    topic: 'Fintech innovation, overdraft limits & cross-border cash',
    category: 'Finance',
    time: '4 min',
    image: brandLogos.mpesa,
    initials: 'M',
    tone: 'green',
    logo: brandLogos.mpesa,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'How frequently do you use Fuliza overdraft when funds fall short?', options: ['Regularly for everyday transactions', 'Only during unexpected month-end crunches', 'Rarely, prefer borrowing from friends', 'Never used Fuliza'] },
      { question: 'Have you sent or received money cross-border using M-Pesa Global?', options: ['Yes, to East Africa (Uganda, Tanzania, Rwanda)', 'Yes, to Western Union / PayPal / Remitly', 'Heard of it but not used yet', 'No cross-border needs'] },
      { question: 'What feature of M-Pesa do you find most indispensable daily?', options: ['Send Money to anyone instantly', 'Paybill and Buy Goods payments', 'Bank to M-Pesa seamless integration', 'M-Pesa statement and transaction history'] },
      { question: 'What would improve your mobile money satisfaction most?', options: ['Lower transaction tariffs across all bands', 'Biometric fingerprint approval for every payment', 'Split bill feature for groups and chamas', 'Virtual debit card for international websites'] },
      { question: 'How do you manage M-Pesa transaction security on your handset?', options: ['Strictly secret PIN known only to me', 'Frequent PIN changes and SIM lock enabled', 'Fingerprint unlock on M-Pesa App', 'Standard basic security precautions'] },
    ],
  },
  {
    id: 19,
    company: 'Kenya Power (KPLC)',
    topic: 'Prepaid tokens, grid reliability & clean solar transition',
    category: 'Lifestyle',
    time: '4 min',
    image: brandLogos.kplc,
    initials: 'KP',
    tone: 'blue',
    logo: brandLogos.kplc,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'How do you normally purchase your KPLC electricity tokens?', options: ['M-Pesa Paybill directly', 'Commercial bank mobile banking app', 'Third-party token vendors & apps', 'Post-paid monthly bill settlement'] },
      { question: 'What is your household average monthly spend on electricity tokens?', options: ['Under KSh 800', 'KSh 800 - KSh 2,000', 'KSh 2,000 - KSh 4,500', 'Over KSh 4,500'] },
      { question: 'How stable is electricity power supply in your neighbourhood?', options: ['Very stable, rare blackouts', 'Occasional power cuts during storms', 'Frequent unscheduled load shedding', 'Severe persistent power interruptions'] },
      { question: 'Have you considered installing solar panels or home power backup?', options: ['Already using solar lighting/water heating', 'Actively budgeting to install solar', 'Interested but initial cost is high', 'Not considering solar currently'] },
      { question: 'What customer service channel do you turn to during an outage?', options: ['Twitter/X official handle (@KenyaPower_Care)', 'USSD code (*977#)', 'Toll-free customer hotline call', 'MyPower mobile application'] },
    ],
  },
  {
    id: 20,
    company: 'TotalEnergies Kenya',
    topic: 'Fuel service stations, lubricants & convenience stores',
    category: 'Travel',
    time: '4 min',
    image: brandLogos.totalenergies,
    initials: 'TE',
    tone: 'red',
    logo: brandLogos.totalenergies,
    locked: true,
    potential: 250,
    potentialDaily: 'KSh 2,500/day',
    questions: [
      { question: 'How often do you visit a fuel service station in a month?', options: ['Several times a week for fuel', 'Once a week to top up', 'Once or twice a month', 'Only to buy LPG gas or use convenience shop'] },
      { question: 'What determines which fuel station brand you pull into?', options: ['Proximity and convenience of location', 'Fuel quality & engine-cleaning additives', 'Competitive prices and loyalty perks', 'Clean washrooms and Bonjour shop amenities'] },
      { question: 'How do you prefer paying for fuel or automotive services?', options: ['M-Pesa contactless till', 'TotalEnergies fuel card', 'Debit or credit card tap', 'Cash payments'] },
      { question: 'Do you buy TotalEnergies Rubia engine oil or car servicing on site?', options: ['Yes, always trust station mechanics', 'Buy oil but service elsewhere', 'Only purchase fuel and wash car', 'Do not own a motor vehicle'] },
      { question: 'What extra service at petrol stations do you appreciate most?', options: ['Tyre pressure air and water check', 'Clean well-stocked convenience store (Bonjour)', 'Car wash and vacuum service', 'Safe 24-hour ATM and pharmacy'] },
    ],
  },
  {
    id: 21,
    company: 'Bamburi Cement',
    topic: 'Home building, quality materials & masonry trends',
    category: 'Lifestyle',
    time: '5 min',
    image: brandLogos.bamburi,
    initials: 'BC',
    tone: 'orange',
    logo: brandLogos.bamburi,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'Are you currently undertaking or planning home construction in Kenya?', options: ['Currently actively building', 'Planning to start within 1 to 2 years', 'Renovating an existing house/shop', 'No construction plans right now'] },
      { question: 'What is the most decisive factor when buying cement brands?', options: ['Proven structural strength & durability', 'Affordable price per 50kg bag', 'Recommendation from trusted builder/fundi', 'Brand reputation and availability at local hardware'] },
      { question: 'How do you source construction materials for your projects?', options: ['Directly purchase at neighbourhood hardware', 'Direct order from manufacturer/wholesaler', 'Contractor purchases on my behalf', 'Compare prices online before buying'] },
      { question: 'Are you interested in eco-friendly, green cement with lower carbon footprint?', options: ['Yes, actively prioritize green materials', 'Interested if price is the same as normal cement', 'Need more technical information first', 'Not a key concern for my project'] },
      { question: 'What service would make building a home in Kenya easier for you?', options: ['Certified builder/fundi directory', 'Accurate material quantity estimator tool', 'Doorstep delivery to construction site', 'Credit financing for building supplies'] },
    ],
  },
  {
    id: 22,
    company: 'Starlink Kenya',
    topic: 'Satellite internet adoption for rural & remote Kenya',
    category: 'Technology',
    time: '4 min',
    image: brandLogos.starlink,
    initials: 'SL',
    tone: 'blue',
    logo: brandLogos.starlink,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'Have you heard of Starlink satellite internet services in Kenya?', options: ['Yes, following developments closely', 'Heard the name on social media/news', 'Seen dish kits installed in my area', 'Hearing about it for the first time'] },
      { question: 'For what setting would high-speed satellite broadband benefit you most?', options: ['Rural countryside home / Upcountry shags', 'Remote safari lodge / agricultural farm', 'Backup internet for city home/business', 'Travelling and camping adventures'] },
      { question: 'What do you consider an attractive monthly price for unlimited satellite web?', options: ['Under KSh 3,000 / month', 'KSh 3,000 - KSh 5,000 / month', 'KSh 5,000 - KSh 8,000 / month', 'Willing to pay premium if fast everywhere'] },
      { question: 'What hardware purchase model would make satellite internet accessible?', options: ['Monthly hardware rental / lease model', 'One-off full hardware purchase', 'Subsidized price bundled with 1-year contract', 'Rent-to-own instalment plan via M-Pesa'] },
      { question: 'Would you consider pooling money with neighbours to share a connection?', options: ['Yes, great way to split costs', 'Maybe with trusted family members', 'Prefer having dedicated private Wi-Fi', 'Not interested in shared internet'] },
    ],
  },
  {
    id: 23,
    company: 'Uber Kenya',
    topic: 'Airport mobility, premier rides & passenger safety',
    category: 'Travel',
    time: '4 min',
    image: brandLogos.uber,
    initials: 'U',
    tone: 'green',
    logo: brandLogos.uber,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'For what journeys do you most frequently choose Uber?', options: ['Late night trips after events/dinners', 'Airport journeys with luggage (JKIA/Wilson)', 'Rainy morning office commute', 'Personal errands across the city'] },
      { question: 'How important is driver vehicle rating and safety history to you?', options: ['Extremely important, checks rating before ride', 'Important, expects clean safe car', 'Moderate, speed of arrival matters more', 'Unimportant if fare is lowest'] },
      { question: 'Have you used Uber Reserve to schedule a ride days in advance?', options: ['Yes, essential for early morning flights', 'Tried it once or twice', 'Did not know pre-booking was possible', 'Never used Uber Reserve'] },
      { question: 'Which ride tier fits your regular budget best?', options: ['Uber ChapChap / Saver', 'Standard UberX', 'Uber Comfort (newer spacious cars)', 'Uber Boda'] },
      { question: 'What in-car comfort amenity do you appreciate most during a ride?', options: ['Pleasant quiet ride without loud radio', 'Functional air conditioning on hot days', 'Polite driver greeting and smooth driving', 'Phone charger cord available in rear'] },
    ],
  },
  {
    id: 24,
    company: 'DStv Kenya',
    topic: 'Family television entertainment & premier sports viewing',
    category: 'Entertainment',
    time: '5 min',
    image: brandLogos.dstv,
    initials: 'D',
    tone: 'blue',
    logo: brandLogos.dstv,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'Which pay-TV or decoder service is active in your living room?', options: ['DStv Satellite Decoder', 'GOtv Digital Decoder', 'Free-to-Air digital box only', 'Smart TV with streaming apps only'] },
      { question: 'What programming does your household gather to watch most?', options: ['SuperSport live football & athletics', 'Local Maisha Magic drama series', 'Kids cartoons & educational channels', 'International news (BBC, CNN, Al Jazeera)'] },
      { question: 'Do you use DStv Stream on mobile phones when away from home?', options: ['Yes, watch matches anywhere on the go', 'Used occasionally during travel', 'Have not linked my decoder to the app', 'Prefer watching on big living room screen'] },
      { question: 'What matters most when selecting a television package bouquet?', options: ['All major live football matches included', 'Affordable monthly subscription price', 'Wide variety of cartoons for children', 'Local Kenyan channels with Swahili audio'] },
      { question: 'What would improve your satellite TV satisfaction most?', options: ['A-la-carte channel selection (pay only what you watch)', 'Rain-fade proof satellite reception', 'Automatic monthly loyalty discount', 'Instant self-service clearing of error codes on WhatsApp'] },
    ],
  },
  {
    id: 25,
    company: 'Rubis Energy Kenya',
    topic: 'UltraTec fuel performance, modern service stations & loyalty',
    category: 'Travel',
    time: '5 min',
    image: brandLogos.rubis,
    initials: 'RE',
    tone: 'red',
    logo: brandLogos.rubis,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'What matters most to you when choosing an automotive fuel station in Kenya?', options: ['Advanced engine-cleaning additives', 'Accurate pump meter calibration', 'Express convenience store (Brioche/Shop)', 'Fast M-Pesa till payment checkout'] },
      { question: 'How often do you fill up your vehicle or purchase LPG gas at Rubis stations?', options: ['Multiple times weekly', 'Weekly full-tank fill', 'Bi-weekly top-up', 'Monthly household gas purchase only'] },
      { question: 'Have you noticed any fuel economy improvement using Rubis UltraTec fuel?', options: ['Significant mileage improvement', 'Noticeable engine responsiveness', 'Comparable to other premium fuels', 'Have not monitored fuel efficiency'] },
      { question: 'Which non-fuel service at modern petrol stations do you use most?', options: ['Brioche café & pastry shop', 'Vehicle wash and detailing bay', 'LPG cylinder exchange', '24/7 ATM and convenience retail'] },
      { question: 'What promotional reward would make Rubis your exclusive fuel partner?', options: ['Instant cashback per litre via M-Pesa', 'Free vehicle wash with full tank', 'Discounted cooking gas refills', 'Airtime rewards on every top-up'] },
    ],
  },
  {
    id: 26,
    company: 'Java House Signature',
    topic: 'Artisan Arabica roasting, boardroom catering & casual dining',
    category: 'Lifestyle',
    time: '5 min',
    image: brandLogos.javahouse,
    initials: 'JH',
    tone: 'green',
    logo: brandLogos.javahouse,
    locked: true,
    potential: 350,
    potentialDaily: 'KSh 3,500/day',
    questions: [
      { question: 'What is your favourite beverage or specialty roast at Java House?', options: ['Classic Single Origin AA Kenyan Coffee', 'Caramel Macchiato / Mocha', 'Fresh tropical fruit juice blend', 'Java signature creamy milkshake'] },
      { question: 'What setting best describes your visits to Java House restaurants?', options: ['Remote working & laptop sessions', 'Executive business lunches', 'Casual catchups with close friends', 'Family weekend breakfast/brunch'] },
      { question: 'How do you rate the Wi-Fi connectivity and workspace comfort at Java branches?', options: ['Excellent, reliable for video meetings', 'Good for basic email and browsing', 'Could use more dedicated power sockets', 'Only visit for dining, not working'] },
      { question: 'Would you order Java House gourmet meals through corporate delivery catering?', options: ['Yes, ideal for team meetings & events', 'Regularly order individual takeaways', 'Prefer sit-down dining experience', 'Price is a primary consideration'] },
      { question: 'What premium loyalty benefit would you appreciate most as a Java guest?', options: ['Every 5th coffee complimentary', 'Complimentary dessert on your birthday', 'Priority seating at peak hours', 'Exclusive invites to coffee tasting sessions'] },
    ],
  },
  {
    id: 27,
    company: 'Standard Chartered Priority',
    topic: 'Offshore investments, wealth advisory & premier credit solutions',
    category: 'Finance',
    time: '6 min',
    image: brandLogos.standardchartered,
    initials: 'SC',
    tone: 'blue',
    logo: brandLogos.standardchartered,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'Which wealth management vehicle forms the cornerstone of your financial growth?', options: ['Offshore foreign currency investments', 'High-yield Money Market Funds (MMF)', 'Commercial real estate & land assets', 'Private equity & business expansions'] },
      { question: 'How valuable is a dedicated Relationship Manager to your banking experience?', options: ['Essential for personalized wealth advisory', 'Helpful for swift loan approvals', 'Prefer 100% digital app-based banking', 'Only need assistance for major transactions'] },
      { question: 'What international banking facility do you rely on most frequently?', options: ['Multi-currency debit & credit cards', 'Seamless foreign remittance transfers', 'Global airport VIP lounge access (Priority Pass)', 'International student fee payments'] },
      { question: 'What criteria determines your confidence in a private wealth institution?', options: ['Global heritage & regulatory stability', 'Competitive returns on fixed deposits', 'Cutting-edge digital security & encryption', 'Discreet and bespoke customer service'] },
      { question: 'Which emerging asset class are you most interested in exploring with an advisor?', options: ['Green ESG and sustainable bonds', 'Global technology equities & index funds', 'Kenyan infrastructure Treasury bonds', 'Gold and precious commodity funds'] },
    ],
  },
  {
    id: 28,
    company: 'Shell / Vivo Energy Kenya',
    topic: 'V-Power performance, Shell Card & highway stations',
    category: 'Travel',
    time: '5 min',
    image: brandLogos.shell,
    initials: 'SH',
    tone: 'orange',
    logo: brandLogos.shell,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'What is your primary factor when fueling at Shell petrol stations?', options: ['Shell V-Power high-octane performance', 'Shell FuelSave fuel efficiency', 'Clean washrooms and Shell Select store', 'Shell Card / M-Pesa cashless payment speed'] },
      { question: 'How frequently do you top up or purchase Shell Helix engine oil?', options: ['At every scheduled vehicle oil service', 'Every few months top-up', 'Only when advised by my mechanic', 'Do not own a personal vehicle'] },
      { question: 'Which Shell highway station service do you find most convenient?', options: ['Java House / fast food on-site branch', '24-hour convenience store (Shell Select)', 'Clean restrooms and tyre pressure bay', 'Instant M-Pesa agent services'] },
      { question: 'Have you used the Shell Club loyalty app to redeem rewards?', options: ['Yes, actively scan on every fueling', 'Registered but rarely check points', 'Heard about it but have not downloaded', 'Not registered'] },
      { question: 'What promotion would convince you to fuel exclusively with Shell?', options: ['Instant M-Pesa cashbacks on every 20 litres', 'Free barista coffee with full tank', 'Discount vouchers on LPG Afrigas', 'Monthly raffle for free annual fuel'] },
    ],
  },
  {
    id: 29,
    company: 'Britam Holdings Insurance',
    topic: 'Comprehensive motor cover, medical & retirement planning',
    category: 'Finance',
    time: '5 min',
    image: brandLogos.britam,
    initials: 'BR',
    tone: 'blue',
    logo: brandLogos.britam,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'What type of insurance policy do you prioritize for your family?', options: ['Inpatient and outpatient health cover', 'Comprehensive private vehicle cover', 'Child education endowment fund', 'Life and funeral expense protection'] },
      { question: 'How do you prefer purchasing and renewing your insurance policies?', options: ['Direct mobile app or USSD (*778#)', 'Through a certified insurance broker/agent', 'Direct corporate office / bank branch', 'Online self-service web portal'] },
      { question: 'What is the most decisive factor in choosing an insurance underwriter?', options: ['Reputation for swift claims settlement', 'Affordable monthly or quarterly premiums', 'Wider hospital and garage panel network', 'Clear and easy policy terms without fine print'] },
      { question: 'Have you invested in Money Market Funds (MMF) or unit trusts with Britam?', options: ['Yes, active monthly investor', 'Planning to open an account this quarter', 'Interested in personal pension plan', 'Never invested in asset management'] },
      { question: 'What digital feature would make insurance simpler for you in Kenya?', options: ['Instant claim submission via WhatsApp/Photo', 'Flexible daily micro-premiums via M-Pesa', 'Telemedicine doctor consultations in-app', 'Real-time investment return tracker'] },
    ],
  },
  {
    id: 30,
    company: 'Crown Paints Kenya',
    topic: 'Interior decor trends, anti-bacterial paints & exterior finishes',
    category: 'Lifestyle',
    time: '5 min',
    image: brandLogos.crownpaints,
    initials: 'CP',
    tone: 'red',
    logo: brandLogos.crownpaints,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'When repainting your home, what room do you prioritize refreshing first?', options: ['Living room and dining space', 'Master bedroom and kids rooms', 'Kitchen and bathrooms (moisture resistance)', 'Exterior perimeter walls and gates'] },
      { question: 'What paint property is most crucial for long-lasting quality?', options: ['Washable stain-resistant surface', 'Vibrant colour retention and zero fading', 'Anti-fungal and weather defence protection', 'Low odour and eco-friendly composition'] },
      { question: 'How do you decide on colour schemes and paint finishes?', options: ['Crown Paints digital colour chart & mobile app', 'Advice from professional painter / contractor', 'Inspiration from Pinterest / Instagram homes', 'Sample paint tester pots on the wall first'] },
      { question: 'Where do you normally buy house paints and varnishes?', options: ['Authorized Crown Paints showroom', 'Local neighbourhood hardware dealer', 'General builder contractor supplies', 'Online hardware ordering'] },
      { question: 'Would you use a virtual reality paint app to preview shades on your room walls?', options: ['Definitely, prevents costly colour mistakes', 'Yes, if easy to use with phone camera', 'Prefer physical colour swatch fan books', 'Leave colour selection to fundi'] },
    ],
  },
  {
    id: 31,
    company: 'Absa Bank Kenya Premier',
    topic: 'Premier banking, mortgage finance & agribusiness credit',
    category: 'Finance',
    time: '6 min',
    image: brandLogos.absa,
    initials: 'AB',
    tone: 'red',
    logo: brandLogos.absa,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'What banking solution would empower your wealth growth this year?', options: ['Competitive commercial mortgage for property', 'Working capital overdraft for enterprise', 'Multi-currency investment account (USD/GBP)', 'Agribusiness asset financing & leasing'] },
      { question: 'How do you rate the digital experience on Absa Mobile Banking?', options: ['Very responsive, love Timiza and mobile loans', 'Great security with biometric sign-in', 'Good, but would like lower transaction charges', 'Prefer visiting prestige banking lounges'] },
      { question: 'Have you considered financing a commercial or residential property?', options: ['Actively looking for mortgage pre-approval', 'Looking to build on owned land via construction loan', 'Planning to buy within next 3 years', 'Not interested in mortgage debt'] },
      { question: 'Which premier credit card privilege appeals to you most?', options: ['Free VIP airport lounge access globally', 'Cashback points on fuel, dining and groceries', 'Comprehensive worldwide travel insurance', 'Flexible 0% interest instalment plans'] },
      { question: 'What makes you recommend a banking partner to business associates?', options: ['Fast turnaround on credit and trade finance', 'Personalized attention from relationship manager', 'Zero system downtime during month-end transfers', 'Competitive foreign exchange margins'] },
    ],
  },
  {
    id: 32,
    company: 'Co-operative Bank Kingdom Banking',
    topic: 'SACCO empowerment, MSME Till financing & asset acquisition',
    category: 'Finance',
    time: '5 min',
    image: brandLogos.coop,
    initials: 'CO',
    tone: 'green',
    logo: brandLogos.coop,
    locked: true,
    potential: 450,
    potentialDaily: 'KSh 4,500/day',
    questions: [
      { question: 'Are you a member of a registered Kenyan SACCO or investment chama?', options: ['Yes, active contributor in teacher/corporate SACCO', 'Yes, member of community chama / investment club', 'Planning to join a Tier-1 SACCO this year', 'No SACCO affiliation'] },
      { question: 'What is your experience with Co-op Bank MCo-opCash digital app?', options: ['Daily transactions, Paybill and salary advances', 'Used occasionally for school fee payments', 'Prefer using Co-op Kwa Jirani agents', 'Not an active account holder'] },
      { question: 'How important is asset financing for vehicles or machinery for you?', options: ['High priority for expanding business fleet', 'Interested in farm tractor / equipment loan', 'Looking at personal car financing', 'Not seeking asset loans currently'] },
      { question: 'What Co-op Kwa Jirani agent service do you rely on most?', options: ['Cash deposit without going to city centre', 'Cash withdrawal during evening hours', 'School fees and utility token payments', 'Balance enquiry and mini-statement'] },
      { question: 'What financial education program would benefit your community most?', options: ['Chama investment governance & property buying', 'Youth agribusiness & export value chain training', 'Digital bookkeeping for small retail shops', 'Personal financial budgeting and debt management'] },
    ],
  },
  {
    id: 33,
    company: 'Serena Hotels & Safari Resorts',
    topic: 'Eco-tourism, luxury safari lodges & coastal holiday getaways',
    category: 'Travel',
    time: '5 min',
    image: brandLogos.serena,
    initials: 'SE',
    tone: 'orange',
    logo: brandLogos.serena,
    locked: true,
    potential: 550,
    potentialDaily: 'KSh 5,500/day',
    questions: [
      { question: 'Which Kenyan safari or holiday destination is at the top of your travel bucket list?', options: ['Maasai Mara National Reserve during migration', 'Amboseli National Park with Mount Kilimanjaro views', 'Serena Beach Resort & Spa in Mombasa', 'Ol Pejeta Conservancy & Mount Kenya lodges'] },
      { question: 'What matters most to you during a luxury resort stay in Kenya?', options: ['Exquisite authentic dining & local culinary arts', 'World-class hospitality & courteous attention', 'Eco-friendly sustainable conservation practices', 'Serene spa and wellness relaxation amenities'] },
      { question: 'How far in advance do you typically plan family holiday getaways?', options: ['3 to 6 months in advance for festive season', '1 to 2 months before long weekend breaks', 'Spontaneous last-minute weekend getaways', 'Only travel during corporate retreat events'] },
      { question: 'Have you signed up for Serena Prestige Club frequent guest loyalty?', options: ['Yes, active member earning room upgrades', 'Heard of it, planning to register on next visit', 'Prefer booking through travel agency packages', 'Not familiar with the loyalty program'] },
      { question: 'What incentive would make you book an upcountry weekend retreat sooner?', options: ['Resident all-inclusive discounts with game drives', 'Kids stay free family weekend package', 'Complimentary round-trip airstrip transfers', 'Spa voucher included with 2-night stay'] },
    ],
  },
  {
    id: 34,
    company: 'Emirates Airlines Kenya',
    topic: 'International business travel, Dubai stopovers & skywards rewards',
    category: 'Travel',
    time: '6 min',
    image: brandLogos.emirates,
    initials: 'EK',
    tone: 'red',
    logo: brandLogos.emirates,
    locked: true,
    potential: 650,
    potentialDaily: 'KSh 6,500/day',
    questions: [
      { question: 'For what purpose do you most frequently book international long-haul flights?', options: ['Business conferences & global trade imports', 'Family holiday vacations & leisure tours', 'Visiting relatives residing in Europe / Americas', 'Higher education studies and internships'] },
      { question: 'What inflight feature defines your preferred choice of international airline?', options: ['Award-winning ice inflight entertainment system', 'Gourmet dining menu and complimentary beverages', 'Generous checked baggage allowance (2 x 23kg)', 'Spacious seat pitch and comfortable legroom'] },
      { question: 'Have you taken advantage of the Dubai Connect complimentary stopover program?', options: ['Yes, enjoyed exploring Dubai during transit', 'Planning a 2-day Dubai shopping holiday', 'Prefer shortest possible connection layover', 'Never transited through Dubai International Airport'] },
      { question: 'How do you prefer managing your Skywards frequent flyer miles?', options: ['Redeeming for flight seat upgrades to Business Class', 'Converting miles into hotel stays and car rentals', 'Sharing miles with family account pool', 'Collecting miles but have not redeemed yet'] },
      { question: 'What payment option makes booking international flight tickets easiest in Kenya?', options: ['Instant M-Pesa mobile checkout on Emirates.com', 'Credit card with flexible monthly instalments', 'Local travel agent desk in Nairobi / Mombasa', 'Bank electronic wire transfer'] },
    ],
  },
];

const categories = [
  { name: 'Everyday surveys', price: 0, potential: 2000, description: 'Your starting collection · 14 free surveys', icon: Sparkles, tone: 'green' },
  { name: 'Company insights', price: 150, potential: 4500, description: 'More brands, more perspectives', icon: Zap, tone: 'orange' },
  { name: 'Premium studies', price: 250, potential: 7500, description: 'Deeper research opportunities', icon: Gift, tone: 'blue' },
  { name: 'Expert opinions', price: 300, potential: 10500, description: 'Special interest research', icon: CircleDollarSign, tone: 'purple' },
];

const upgradePackages = [
  {
    name: 'Basic',
    price: 250,
    dailyLimit: 10000,
    extraSurveys: '10+ extra daily surveys',
    detail: 'Essential upgrade for active survey takers',
    icon: Plus,
    badge: 'STARTER',
    features: ['Daily withdrawal limit: KSh 10,000', '10+ extra surveys unlocked', 'Standard M-Pesa processing'],
  },
  {
    name: 'Lite',
    price: 350,
    dailyLimit: 25000,
    extraSurveys: '25+ extra daily surveys',
    detail: 'Enhanced tier with elevated limits and fast payout',
    icon: Zap,
    badge: 'MOST POPULAR',
    features: ['Daily withdrawal limit: KSh 25,000', '25+ extra surveys unlocked', 'Express M-Pesa disbursements', 'Priority survey matching'],
  },
  {
    name: 'Platinum',
    price: 450,
    dailyLimit: 100000,
    extraSurveys: 'Unlimited daily surveys',
    detail: 'Maximum earnings, VIP studies and unlimited withdrawals',
    icon: Sparkles,
    badge: 'BEST VALUE',
    features: ['Daily withdrawal limit: Unlimited (KSh 100,000)', 'All 24+ premium surveys unlocked', 'Instant automated M-Pesa disbursements', 'VIP high-reward studies access'],
  },
];

interface UnlockableSurvey {
  id: number;
  company: string;
  topic: string;
  unlockPrice: number;
  potentialReward: number;
  time: string;
  category: string;
  logo?: string;
  initials: string;
  tone: string;
}

export interface UnlockBundle {
  price: number;
  badge: string;
  surveyTypesCount: number;
  surveyIds: number[];
  headline: string;
  potentialPerSurvey: string;
  totalPotential: number;
}

// Tiered Unlock Bundles:
// Each bundle unlocks 6 survey types with earnings totaling between KSh 1,500 and KSh 3,900
// - 150: 6 surveys @ KSh 250 each = KSh 1,500
// - 170: 6 surveys @ KSh 350 each = KSh 2,100
// - 180: 6 surveys @ KSh 450 each = KSh 2,700
// - 190: 6 surveys @ KSh 550 each = KSh 3,300
// - 200: 6 surveys @ KSh 650 each = KSh 3,900 (strictly under KSh 4,000)
export const UNLOCK_BUNDLES: UnlockBundle[] = [
  {
    price: 150,
    badge: 'STARTER BUNDLE · 6 SURVEY TYPES',
    surveyTypesCount: 6,
    surveyIds: [15, 16, 17, 18, 19, 20],
    headline: 'Connectivity, SME Finance & Energy Infrastructure',
    potentialPerSurvey: 'KSh 250 per survey',
    totalPotential: 1500,
  },
  {
    price: 170,
    badge: 'POPULAR CHOICE · 6 SURVEY TYPES',
    surveyTypesCount: 6,
    surveyIds: [21, 22, 23, 24, 25, 26],
    headline: 'Mobility, Media, Satellite & Food Retail Bundle',
    potentialPerSurvey: 'KSh 350 per survey',
    totalPotential: 2100,
  },
  {
    price: 180,
    badge: 'ACCELERATOR TIER · 6 SURVEY TYPES',
    surveyTypesCount: 6,
    surveyIds: [27, 28, 29, 30, 31, 32],
    headline: 'Corporate Wealth, Insurance, Paints & Agribusiness',
    potentialPerSurvey: 'KSh 450 per survey',
    totalPotential: 2700,
  },
  {
    price: 190,
    badge: 'HIGH-YIELD PRO · 6 SURVEY TYPES',
    surveyTypesCount: 6,
    surveyIds: [18, 22, 28, 31, 33, 34],
    headline: 'Fintech Overdraft, Luxury Resorts & Aviation Bundle',
    potentialPerSurvey: 'KSh 550 per survey',
    totalPotential: 3300,
  },
  {
    price: 200,
    badge: 'MAX EARNINGS VIP · 6 SURVEY TYPES',
    surveyTypesCount: 6,
    surveyIds: [27, 29, 30, 32, 33, 34],
    headline: 'Elite Priority Banking, Luxury Lodges & Skywards',
    potentialPerSurvey: 'KSh 650 per survey',
    totalPotential: 3900,
  },
];

// Unlock prices starting with 150 as first, others tiered up to 200 with earnings proportional and under KSh 4,000
const unlockableSurveysList: UnlockableSurvey[] = [
  {
    id: 15,
    company: 'Safaricom 5G & Fibre',
    topic: 'High-speed broadband, 5G & smart home connectivity',
    unlockPrice: 150,
    potentialReward: 650,
    time: '5 min',
    category: 'Technology',
    logo: brandLogos.safaricom,
    initials: 'S',
    tone: 'green',
  },
  {
    id: 16,
    company: 'Equity EazzyFX & Wealth',
    topic: 'Foreign currency exchange & global wealth building',
    unlockPrice: 150,
    potentialReward: 700,
    time: '5 min',
    category: 'Finance',
    logo: brandLogos.equity,
    initials: 'E',
    tone: 'red',
  },
  {
    id: 20,
    company: 'TotalEnergies Kenya',
    topic: 'Fuel service stations, lubricants & convenience stores',
    unlockPrice: 170,
    potentialReward: 950,
    time: '4 min',
    category: 'Travel',
    logo: brandLogos.totalenergies,
    initials: 'TE',
    tone: 'red',
  },
  {
    id: 25,
    company: 'Rubis Energy Kenya',
    topic: 'UltraTec fuel performance, modern service stations & loyalty',
    unlockPrice: 170,
    potentialReward: 1250,
    time: '5 min',
    category: 'Travel',
    logo: brandLogos.rubis,
    initials: 'RE',
    tone: 'red',
  },
  {
    id: 19,
    company: 'Kenya Power (KPLC)',
    topic: 'Prepaid tokens, grid reliability & clean solar transition',
    unlockPrice: 170,
    potentialReward: 1500,
    time: '4 min',
    category: 'Lifestyle',
    logo: brandLogos.kplc,
    initials: 'KP',
    tone: 'blue',
  },
  {
    id: 17,
    company: 'KCB SME Growth',
    topic: 'Small business hustle, till financing & merchant tools',
    unlockPrice: 180,
    potentialReward: 1800,
    time: '6 min',
    category: 'Finance',
    logo: brandLogos.kcb,
    initials: 'K',
    tone: 'blue',
  },
  {
    id: 24,
    company: 'DStv Kenya',
    topic: 'Family television entertainment & premier sports viewing',
    unlockPrice: 185,
    potentialReward: 2200,
    time: '5 min',
    category: 'Entertainment',
    logo: brandLogos.dstv,
    initials: 'D',
    tone: 'blue',
  },
  {
    id: 26,
    company: 'Java House Signature',
    topic: 'Artisan Arabica roasting, boardroom catering & casual dining',
    unlockPrice: 185,
    potentialReward: 2400,
    time: '5 min',
    category: 'Lifestyle',
    logo: brandLogos.javahouse,
    initials: 'JH',
    tone: 'green',
  },
  {
    id: 18,
    company: 'M-Pesa Global & Fuliza',
    topic: 'Fintech innovation, overdraft limits & cross-border transfers',
    unlockPrice: 190,
    potentialReward: 2750,
    time: '4 min',
    category: 'Finance',
    logo: brandLogos.mpesa,
    initials: 'M',
    tone: 'green',
  },
  {
    id: 21,
    company: 'Bamburi Cement',
    topic: 'Home building, quality materials & masonry trends',
    unlockPrice: 190,
    potentialReward: 2900,
    time: '5 min',
    category: 'Lifestyle',
    logo: brandLogos.bamburi,
    initials: 'BC',
    tone: 'orange',
  },
  {
    id: 23,
    company: 'Uber Kenya',
    topic: 'Airport mobility, premier rides & passenger safety',
    unlockPrice: 195,
    potentialReward: 3300,
    time: '4 min',
    category: 'Travel',
    logo: brandLogos.uber,
    initials: 'U',
    tone: 'green',
  },
  {
    id: 22,
    company: 'Starlink Kenya',
    topic: 'Satellite internet adoption for rural & remote Kenya',
    unlockPrice: 200,
    potentialReward: 3750,
    time: '4 min',
    category: 'Technology',
    logo: brandLogos.starlink,
    initials: 'SL',
    tone: 'blue',
  },
  {
    id: 27,
    company: 'Standard Chartered Priority',
    topic: 'Offshore investments, wealth advisory & premier credit solutions',
    unlockPrice: 200,
    potentialReward: 3900,
    time: '6 min',
    category: 'Finance',
    logo: brandLogos.standardchartered,
    initials: 'SC',
    tone: 'blue',
  },
];

const liveProofFeed = [
  { id: '1', name: 'Faith W.', town: 'Nairobi', initials: 'FW', color: '#059669', action: 'withdrew via M-Pesa', amount: 'KSh 3,400', time: 'Just now' },
  { id: '2', name: 'Kevin O.', town: 'Eldoret', initials: 'KO', color: '#2563eb', action: 'received payment for Safaricom 5G survey', amount: '+KSh 250', time: '1m ago' },
  { id: '3', name: 'Mercy M.', town: 'Mombasa', initials: 'MM', color: '#d97706', action: 'withdrew via M-Pesa', amount: 'KSh 4,200', time: '2m ago' },
  { id: '4', name: 'Dennis K.', town: 'Kisumu', initials: 'DK', color: '#7c3aed', action: 'unlocked 6-Survey VIP Bundle', amount: '+KSh 3,900', time: '4m ago' },
  { id: '5', name: 'Brian N.', town: 'Nakuru', initials: 'BN', color: '#059669', action: 'withdrew via M-Pesa', amount: 'KSh 2,850', time: '5m ago' },
  { id: '6', name: 'Achieng O.', town: 'Kisii', initials: 'AO', color: '#dc2626', action: 'received payment for Equity Bank study', amount: '+KSh 250', time: '7m ago' },
  { id: '7', name: 'Samuel M.', town: 'Thika', initials: 'SM', color: '#0284c7', action: 'withdrew via M-Pesa', amount: 'KSh 3,100', time: '8m ago' },
  { id: '8', name: 'Esther K.', town: 'Machakos', initials: 'EK', color: '#16a34a', action: 'received payment for KCB SME survey', amount: '+KSh 450', time: '10m ago' },
];

function Index() {
  const [view, setView] = useState<View>('landing');
  const [modal, setModal] = useState<Modal>(null);
  const [activationStep, setActivationStep] = useState(0);
  const [activated, setActivated] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('0712 345 678');
  const [error, setError] = useState('');
  const [activeSurvey, setActiveSurvey] = useState<Survey>(surveyData[0]!);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [unlockedSurveyIds, setUnlockedSurveyIds] = useState<number[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedUpgrade, setSelectedUpgrade] = useState(1);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('2500');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [isSimulatingStk, setIsSimulatingStk] = useState(false);
  const [toastIndex, setToastIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);

  // Supabase Auth and Live Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('0712 345 678');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [withdrawalDbId, setWithdrawalDbId] = useState<string | null>(null);
  const [stkStatusMsg, setStkStatusMsg] = useState('');

  // Strategic Social Proof Toasts (only shown inside dashboard for authenticated users, never on public landing)
  useEffect(() => {
    if (modal === 'survey' || toastDismissed || view === 'landing') {
      setShowToast(false);
      return;
    }
    const interval = setInterval(() => {
      if (!toastDismissed) {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setToastIndex(prev => (prev + 1) % liveProofFeed.length);
        }, 4500);
      }
    }, 11000);

    const initialTimer = setTimeout(() => {
      if (!toastDismissed) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [modal, toastDismissed, view]);

  // Auth session sync — load user on mount, persist to/from Supabase
  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setCurrentUser(session.user);
          const profile = await getProfile(session.user.id);
          if (profile && mounted) {
            if (profile.phone) setPhone(profile.phone);
            if (profile.plan) setPlan(profile.plan);
            if (profile.completed_surveys?.length) setCompleted(profile.completed_surveys);
            if (profile.unlocked_survey_ids?.length) setUnlockedSurveyIds(profile.unlocked_survey_ids);
            if (profile.activated !== undefined) setActivated(profile.activated);
          }
        }
      } catch (e) {
        console.error('Session load error:', e);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setCurrentUser(session.user);
        const profile = await getProfile(session.user.id);
        if (profile && mounted) {
          if (profile.phone) setPhone(profile.phone);
          if (profile.plan) setPlan(profile.plan);
          if (profile.completed_surveys?.length) setCompleted(profile.completed_surveys);
          if (profile.unlocked_survey_ids?.length) setUnlockedSurveyIds(profile.unlocked_survey_ids);
          if (profile.activated !== undefined) setActivated(profile.activated);
        }
      } else {
        setCurrentUser(null);
      }
    });

    // Support accessing signup / login via route query parameter (e.g. /?auth=signup or /?signup=true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth') || params.get('mode');
      if (authParam === 'signup' || params.has('signup')) {
        setAuthMode('signup');
        setAuthError('');
        setModal('auth');
      } else if (authParam === 'login' || params.has('login')) {
        setAuthMode('login');
        setAuthError('');
        setModal('auth');
      }
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncCompletedSurveys = useCallback(async (newCompleted: number[], newBalance: number) => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser.id, {
        completed_surveys: newCompleted,
        balance: newBalance,
        activated: true,
      });
    } catch (e) {
      console.error('Sync error:', e);
    }
  }, [currentUser]);

  // Free survey earnings cap at KSh 2,000 (KSh 150 each)
  // Unlocked surveys grant their individual tiered potential reward
  const freeSurveyEarnings = completed.filter(id => id <= 14).length * 150;
  const unlockedRewards = completed
    .filter(id => id > 14)
    .reduce((sum, id) => sum + (surveyData.find(s => s.id === id)?.potential ?? 650), 0);
  const earned = Math.min(2000, freeSurveyEarnings) + unlockedRewards;
  const balance = earned + (activated ? Number(amount) || 0 : 0);

  // Daily withdrawal limit based on account plan tier:
  // Free: 3,000/day; Basic: 10,000/day; Lite: 25,000/day; Platinum: 100,000/day
  const currentDailyLimit = !plan || plan === 'Free' ? 3000 : plan === 'Basic' ? 10000 : plan === 'Lite' ? 25000 : 100000;

  const filteredSurveys = surveyData.filter(s => {
    // 1. Category filter
    const matchesCategory = filter === 'All' || s.category === filter;
    if (!matchesCategory) return false;

    // 2. Search query filter
    const query = search.trim().toLowerCase();
    if (!query) return true;

    // Build comprehensive searchable corpus for this survey
    const searchableFields = [
      s.company,
      s.topic,
      s.category,
      `ksh ${s.potential}`,
      `ksh${s.potential}`,
      `${s.potential}`,
      s.potentialDaily,
      s.potentialDaily.replace(/,/g, ''),
      s.time,
    ].join(' ').toLowerCase();

    // Check all words/terms in query
    const terms = query.split(/\s+/).filter(Boolean);
    return terms.every(term => {
      // Direct text match (company name, topic keywords, category, or formatted amount)
      if (searchableFields.includes(term)) return true;

      // Numeric amount match (e.g. searching "150", "600", "800", "1000", "1500")
      const termNumeric = term.replace(/[^\d]/g, '');
      if (termNumeric) {
        if (s.potential.toString().includes(termNumeric)) return true;
        if (s.potentialDaily.replace(/[^\d]/g, '').includes(termNumeric)) return true;
      }

      return false;
    });
  });

  const closeModal = () => {
    setModal(null);
    setError('');
    setWithdrawError('');
    setWithdrawSuccess(false);
    setIsSimulatingStk(false);
    setStkStatusMsg('');
  };

  const navigate = (next: View) => {
    setView(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSurvey = (survey: Survey) => {
    setActiveSurvey(survey);

    // Requirement: When user tries to attempt a survey, pop activation modal if not activated
    if (!activated) {
      setActivationStep(0);
      setModal('activation');
      return;
    }

    // Free surveys earn user up to 2,000. If free survey cap reached or survey is locked:
    const isLockedForUser =
      (survey.locked || freeSurveyEarnings >= 2000) &&
      (!plan || plan === 'Free') &&
      !unlockedSurveyIds.includes(survey.id);

    if (isLockedForUser) {
      setModal('run_out_free');
      return;
    }

    setQuestionIndex(0);
    setSelected(null);
    setSurveyDone(false);
    setModal('survey');
  };

  // Auto-advance to next question upon selecting an option (no manual next button needed)
  const handleSelectOption = (option: string) => {
    if (selected) return;
    setSelected(option);
    setTimeout(() => {
      if (questionIndex < activeSurvey.questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
        setSelected(null);
      } else {
        if (!completed.includes(activeSurvey.id)) {
          setCompleted(prev => {
            const newCompleted = [...prev, activeSurvey.id];
            const newFreeSurveyEarnings = newCompleted.filter(id => id <= 14).length * 150;
            const newUnlockedRewards = newCompleted
              .filter(id => id > 14)
              .reduce((sum, id) => sum + (surveyData.find(s => s.id === id)?.potential ?? 650), 0);
            const newEarned = Math.min(2000, newFreeSurveyEarnings) + newUnlockedRewards;
            const newBalance = newEarned + (activated ? Number(amount) || 0 : 0);
            syncCompletedSurveys(newCompleted, newBalance);
            if (currentUser) {
              logSurveyCompletion(currentUser.id, activeSurvey.id, activeSurvey.company, activeSurvey.potential || 150).catch(console.error);
            }
            return newCompleted;
          });
        }
        setSurveyDone(true);
      }
    }, 280);
  };

  const unlockBundle = async (bundle: UnlockBundle) => {
    setIsSimulatingStk(true);
    setStkStatusMsg(`Sending M-Pesa STK push for KSh ${bundle.price}...`);

    try {
      const result = await initiateSTK(phone, bundle.price, `SPK-UNLOCK-${bundle.price}-${Date.now()}`);
      if (!result.success || !result.checkoutId) {
        setError(result.message || 'Payment initiation failed.');
        setIsSimulatingStk(false);
        setStkStatusMsg('');
        return;
      }

      setStkStatusMsg(`STK push sent to ${phone}. Enter your M-Pesa PIN to unlock bundle...`);

      pollSTKStatus(
        result.checkoutId,
        async () => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          const newUnlockedIds = Array.from(new Set([...unlockedSurveyIds, ...bundle.surveyIds]));
          setUnlockedSurveyIds(newUnlockedIds);
          if (currentUser) {
            await updateProfile(currentUser.id, { unlocked_survey_ids: newUnlockedIds });
          }
          closeModal();
          const firstSurvey = surveyData.find(x => x.id === bundle.surveyIds[0]);
          if (firstSurvey) {
            setActiveSurvey(firstSurvey);
            setQuestionIndex(0);
            setSelected(null);
            setSurveyDone(false);
            setModal('survey');
          }
        },
        (failMsg) => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setError(failMsg || 'Payment was not completed.');
        }
      );
    } catch (e) {
      setIsSimulatingStk(false);
      setStkStatusMsg('');
      setError(e instanceof Error ? e.message : 'Unlock payment failed.');
    }
  };

  const unlockSurvey = (surveyId: number, price?: number) => {
    const matchingBundle = UNLOCK_BUNDLES.find(b => b.surveyIds.includes(surveyId) || (price && b.price === price)) || UNLOCK_BUNDLES[0]!;
    unlockBundle(matchingBundle);
  };

  const start = () => {
    if (!currentUser) {
      setAuthMode('signup');
      setAuthError('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthPhone(phone || '0712 345 678');
      setModal('auth');
      return;
    }
    navigate('home');
  };

  const handleWithdraw = async () => {
    setWithdrawError('');
    const amt = Number(withdrawAmount);

    if (!amt || amt < 2500) {
      setWithdrawError('Minimum withdrawal is KSh 2,500.');
      return;
    }

    if (amt > balance) {
      setWithdrawError('Your balance is below this requested amount.');
      return;
    }

    // User rule: Free accounts cannot withdraw more than 3,000 a day.
    // If balance > 3000 or amt > 3000 on free account:
    if ((!plan || plan === 'Free') && (amt > 3000 || balance > 3000)) {
      setWithdrawError(
        `You can't withdraw more than KSh 3,000 a day on a free account. Your account has KSh ${balance.toLocaleString()} which is more than your account tier limit. Upgrade to increase your daily withdrawal limit since there is more money in your account than the account tier limit.`
      );
      return;
    }

    setIsSimulatingStk(true);
    setStkStatusMsg('Initiating M-Pesa withdrawal...');

    try {
      const result = await initiateSTK(phone, amt, `SPK-WD-${Date.now()}`);
      if (!result.success || !result.checkoutId) {
        setWithdrawError(result.message || 'Payment initiation failed.');
        setIsSimulatingStk(false);
        setStkStatusMsg('');
        return;
      }

      setStkStatusMsg('STK push sent! Please enter your M-Pesa PIN on your phone...');
      let dbWdId: string | null = null;
      if (currentUser) {
        const wd = await logWithdrawal(currentUser.id, amt, phone, result.checkoutId);
        dbWdId = wd?.id || null;
        setWithdrawalDbId(dbWdId);
      }

      pollSTKStatus(
        result.checkoutId,
        async (receipt) => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setWithdrawSuccess(true);
          if (dbWdId) {
            await updateWithdrawalStatus(dbWdId, 'completed', receipt);
          }
        },
        (failMsg) => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setWithdrawError(failMsg || 'Withdrawal was cancelled or timed out.');
        }
      );
    } catch (e) {
      setIsSimulatingStk(false);
      setStkStatusMsg('');
      setWithdrawError(e instanceof Error ? e.message : 'Withdrawal failed.');
    }
  };

  const triggerActivationSTK = async () => {
    const num = Number(amount);
    if (!num || num < 50) {
      setError('Minimum confirmation amount is KSh 50.');
      return;
    }
    if (!phone || phone.replace(/\s/g, '').length < 9) {
      setError('Please enter a valid Kenyan M-Pesa phone number.');
      return;
    }

    setIsSimulatingStk(true);
    setStkStatusMsg(`Sending M-Pesa STK prompt of KSh ${num.toLocaleString()} to ${phone}...`);
    setError('');

    try {
      const result = await initiateSTK(phone, num, `SPK-ACT-${Date.now()}`);
      if (!result.success || !result.checkoutId) {
        setError(result.message || 'Payment initiation failed. Please verify your phone number.');
        setIsSimulatingStk(false);
        setStkStatusMsg('');
        setActivationStep(2);
        return;
      }

      setActivationStep(3);
      setStkStatusMsg(`✅ STK Push sent to ${phone}! Check your phone and enter your M-Pesa PIN...`);

      pollSTKStatus(
        result.checkoutId,
        async () => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setActivated(true);
          setActivationStep(4);
          if (currentUser) {
            await updateProfile(currentUser.id, {
              activated: true,
              balance: Number(amount) || 0,
            });
          }
        },
        (failMsg) => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setError(failMsg || 'Payment was not completed. Please try again.');
          setActivationStep(2);
        }
      );
    } catch (e) {
      setIsSimulatingStk(false);
      setStkStatusMsg('');
      setError(e instanceof Error ? e.message : 'Activation failed. Please try again.');
      setActivationStep(2);
    }
  };

  const confirmUpgrade = async (pkgIndex: number) => {
    setSelectedUpgrade(pkgIndex);
    const pkg = upgradePackages[pkgIndex];
    if (!pkg) return;

    setIsSimulatingStk(true);
    setStkStatusMsg(`Sending M-Pesa STK push for KSh ${pkg.price} (${pkg.name} Tier)...`);

    try {
      const result = await initiateSTK(phone, pkg.price, `SPK-UPG-${pkg.name}-${Date.now()}`);
      if (!result.success || !result.checkoutId) {
        setError(result.message || 'Payment initiation failed.');
        setIsSimulatingStk(false);
        setStkStatusMsg('');
        return;
      }

      setStkStatusMsg(`STK push sent to ${phone}. Enter your M-Pesa PIN to activate ${pkg.name} Tier...`);

      pollSTKStatus(
        result.checkoutId,
        async () => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setPlan(pkg.name);
          setUnlocked([1, 2, 3]);
          if (currentUser) {
            await updateProfile(currentUser.id, { plan: pkg.name });
          }
          closeModal();
        },
        (failMsg) => {
          setIsSimulatingStk(false);
          setStkStatusMsg('');
          setError(failMsg || 'Upgrade payment was not completed.');
        }
      );
    } catch (e) {
      setIsSimulatingStk(false);
      setStkStatusMsg('');
      setError(e instanceof Error ? e.message : 'Upgrade failed.');
    }
  };

  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      setAuthError('Please enter your email and password.');
      return;
    }
    if (authMode === 'signup' && !authPhone) {
      setAuthError('Please enter your M-Pesa phone number.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const data = await signUp(authEmail, authPassword, authPhone);
        if (data.user) {
          setCurrentUser(data.user);
          setPhone(authPhone);
        }
        closeModal();
        navigate('home');
      } else {
        const data = await signIn(authEmail, authPassword);
        if (data.user) {
          setCurrentUser(data.user);
          const profile = await getProfile(data.user.id);
          if (profile) {
            if (profile.phone) setPhone(profile.phone);
            if (profile.plan) setPlan(profile.plan);
            if (profile.completed_surveys?.length) setCompleted(profile.completed_surveys);
            if (profile.unlocked_survey_ids?.length) setUnlockedSurveyIds(profile.unlocked_survey_ids);
            if (profile.activated !== undefined) setActivated(profile.activated);
          }
        }
        closeModal();
        navigate('home');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      setAuthError(msg.includes('already registered') ? 'Email already registered. Try logging in.' : msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setCompleted([]);
      setUnlockedSurveyIds([]);
      setPlan(null);
      setActivated(false);
      navigate('landing');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Button variant="ghost" className="brand" onClick={() => navigate('landing')} aria-label="Survey Pay Kenya home">
            <span className="brand-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              SurveyPay <span className="text-emerald-500 font-bold">Kenya</span><span className="brand-period">.</span>
            </span>
          </Button>

          <nav className="desktop-nav" aria-label="Main navigation">
            <Button variant="ghost" className={view === 'landing' ? 'nav-active' : ''} onClick={() => navigate('landing')}>
              Discover
            </Button>
            <Button variant="ghost" className={view === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}>
              Dashboard
            </Button>
            <Button variant="ghost" className={view === 'surveys' ? 'nav-active' : ''} onClick={() => navigate('surveys')}>
              Surveys
            </Button>
            <Button variant="ghost" className={view === 'wallet' ? 'nav-active' : ''} onClick={() => navigate('wallet')}>
              Wallet
            </Button>
          </nav>

          <div className="header-actions">
            <span className="header-location">
              <span className="flag-kenya">🇰🇪</span> Made for Kenya
            </span>
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700" onClick={() => navigate('profile')}>
                  <UserRound className="w-3.5 h-3.5 mr-1" />
                  {currentUser.email?.split('@')[0] || 'Account'}
                </Button>
                <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut} title="Log out">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => { setAuthMode('login'); setAuthError(''); setModal('auth'); }}>
                  Log In
                </Button>
                <Button className="header-cta" onClick={start}>
                  Sign Up <ArrowUpRight />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu-trigger"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {(['landing', 'home', 'surveys', 'wallet', 'profile'] as View[]).map(v => (
              <Button key={v} variant="ghost" onClick={() => navigate(v)}>
                {v === 'landing' ? 'Discover' : v === 'home' ? 'Dashboard' : (v[0]?.toUpperCase() ?? '') + v.slice(1)}
              </Button>
            ))}
          </nav>
        )}
      </header>

      {view === 'landing' ? (
        <main>
          {/* ── HERO ── */}
          <section
            className="hero"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(16,46,39,.94) 0%, rgba(16,46,39,.78) 42%, rgba(16,46,39,.18) 78%), url(${hero})`,
            }}
          >
            <div className="container hero-content">
              <div className="hero-eyebrow">
                <span className="hero-spark">🇰🇪</span> KENYA'S INDEPENDENT CONSUMER RESEARCH PANEL <span className="eyebrow-line" />
              </div>
              <h1>
                Your Opinion Shapes
                <br />Kenya's Biggest Brands.
              </h1>
              <p>
                Survey Pay Kenya is a free online consumer research panel. Thousands of Kenyans complete
                short multiple-choice questionnaires to help telecom companies, banks, supermarkets, and
                retailers improve their everyday services. Registration is free, surveys are quick, and
                your responses are always kept private and anonymous.
              </p>
              <div className="hero-actions">
                <Button className="hero-primary" onClick={start}>
                  Get Started Free <ArrowUpRight />
                </Button>
                <Button
                  className="hero-text"
                  variant="ghost"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  How it works <ArrowRight />
                </Button>
              </div>
              <div className="hero-footnote">
                <span className="avatar-stack">
                  <b>W</b>
                  <b>A</b>
                  <b>K</b>
                </span>
                <span>Thousands of Kenyans already sharing their opinions every week</span>
              </div>
            </div>
            <div className="hero-side-label">FREE CONSUMER SURVEY PANEL · KENYA</div>
          </section>

          {/* ── TRUST STATS BAR ── */}
          <section className="bg-emerald-700 text-white py-6">
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-extrabold">10,000+</div>
                  <div className="text-xs text-emerald-200 mt-0.5">Registered Panel Members</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">5 Min</div>
                  <div className="text-xs text-emerald-200 mt-0.5">Average Survey Duration</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">5+</div>
                  <div className="text-xs text-emerald-200 mt-0.5">Active Research Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">100%</div>
                  <div className="text-xs text-emerald-200 mt-0.5">Free to Join & Participate</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── ABOUT / MISSION ── */}
          <section className="section-space container" id="about-community">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="section-kicker">ABOUT SURVEY PAY KENYA</div>
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight mt-2 mb-4">
                  Kenya's trusted voice for consumer market research
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Survey Pay Kenya is an independent online market research panel based in Nairobi,
                  Kenya. We partner with organisations across telecommunications, banking, retail, and
                  logistics who want to understand how Kenyan consumers experience their products and
                  services in daily life.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  As a registered panel member you gain access to short, structured questionnaires on
                  topics relevant to your everyday life in Kenya. Your anonymised responses contribute
                  directly to research reports that help brands improve customer service, product design,
                  and pricing transparency for millions of Kenyans.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    'Completely free to join — no hidden fees or charges',
                    'All responses are anonymised and never sold individually',
                    'Compliant with Kenya Data Protection Act 2019',
                    'Short surveys averaging 3 – 7 minutes to complete',
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Consumer-First Research</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our questionnaires are designed by professional researchers to capture genuine
                    consumer experiences — not to promote any specific brand or product.
                  </p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Private by Design</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Responses are aggregated at the group level before being shared with research
                    clients. No individual response is ever identifiable or traceable to you personally.
                  </p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Real Impact in Kenya</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Research insights gathered through our panel have helped organisations improve mobile
                    money services, supermarket delivery experiences, and internet access programmes
                    across Kenya.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTOR BAND ── */}
          <section className="brand-band">
            <div className="container brand-band-inner">
              <span>RESEARCH FOCUS AREAS</span>
              <div className="brand-names flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md">Telecommunications & Mobile</span>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md">Banking & Digital Finance</span>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md">Supermarkets & Retail</span>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md">Transport & Urban Mobility</span>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-md">E-Commerce & Delivery</span>
              </div>
            </div>
            <p className="brand-disclaimer text-xs text-gray-500 text-center mt-3">
              Independent consumer opinion panel facilitating structured market research studies across Kenya.
            </p>
          </section>

          {/* ── RESEARCH TOPICS ── */}
          <section className="section-space container pt-0" id="research-topics">
            <div className="section-heading">
              <div>
                <div className="section-kicker">KEY SECTORS</div>
                <h2>Consumer Research Topics in Kenya</h2>
                <p>Explore the industry categories our panel members regularly provide feedback on.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">Technology & Telecom</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Mobile & Internet Services</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Panel members share experiences about mobile data speeds, 4G and 5G network
                  reliability, home fibre broadband quality, call centre responsiveness, and the
                  usability of telecom mobile apps across Nairobi, Mombasa, Kisumu, and other Kenyan
                  counties.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">Finance & Banking</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Digital Banking & Mobile Money</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Research topics include mobile banking app satisfaction, digital wallet adoption, loan
                  accessibility for small businesses, bank branch customer service, and cashless payment
                  experiences at supermarkets and petrol stations across Kenya.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">Retail & Groceries</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Supermarket & Shopping Habits</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Surveys cover grocery shopping frequency, price sensitivity, brand loyalty in staple
                  foods, fresh produce quality ratings, in-store navigation experience, and customer
                  satisfaction with loyalty card programmes at major Kenyan supermarket chains.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">Transport & Mobility</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Urban Commute & Ride-Hailing</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consumer opinions on matatu route reliability, ride-hailing app safety and pricing,
                  traffic congestion experiences in Nairobi CBD, boda-boda regulation, and passenger
                  preferences for last-mile delivery services.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">E-Commerce & Delivery</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Online Shopping in Kenya</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Questionnaires explore online shopping trust levels, delivery speed satisfaction,
                  returns process ease, product authenticity concerns, and reasons Kenyan shoppers
                  choose online versus in-store purchasing across various product categories.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">Energy & Utilities</span>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">Power & Clean Energy Access</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Research on prepaid electricity token experiences, grid reliability in urban and
                  peri-urban Kenya, solar energy adoption drivers and barriers, consumer attitudes toward
                  renewable energy, and LPG versus charcoal cooking fuel preferences.
                </p>
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="how-section" id="how-it-works">
            <div className="container how-inner">
              <div className="how-intro">
                <div className="section-kicker">SIMPLE & FREE</div>
                <h2>
                  How Survey Pay
                  <br />
                  <em>Kenya works.</em>
                </h2>
                <p>Joining our consumer research panel takes less than two minutes. Here is what to expect after you register.</p>
                <Button className="dark-button" onClick={start}>
                  Explore SurveyPay <ArrowUpRight />
                </Button>
              </div>
              <div className="how-steps">
                <div>
                  <span>01 / CREATE</span>
                  <h3>Register a Free Account</h3>
                  <p>Sign up with your email address and a basic profile. No payment card or personal ID required. Registration is free and takes under two minutes.</p>
                  <Search />
                </div>
                <div>
                  <span>02 / BROWSE</span>
                  <h3>Pick a Survey Topic</h3>
                  <p>Browse available questionnaires from the dashboard. Each survey shows its topic, industry category, and estimated completion time so you can choose what interests you.</p>
                  <BarChart3 />
                </div>
                <div>
                  <span>03 / PARTICIPATE</span>
                  <h3>Answer Simple Questions</h3>
                  <p>Complete multiple-choice questions honestly based on your real experiences as a Kenyan consumer. Surveys typically take 3 to 7 minutes to finish.</p>
                  <CheckCircle2 />
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ SECTION ── */}
          <section className="section-space container" id="faq">
            <div className="section-heading">
              <div>
                <div className="section-kicker">FREQUENTLY ASKED QUESTIONS</div>
                <h2>Everything you need to know</h2>
                <p>Common questions from new panel members in Kenya.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  q: 'Is Survey Pay Kenya free to join?',
                  a: 'Yes. Registration and participation are 100% free. You will never be asked to pay to access surveys or to join the panel. If any platform asks you to pay to receive survey invitations, that is not us.',
                },
                {
                  q: 'Who can join the Survey Pay Kenya panel?',
                  a: 'Any Kenyan resident aged 18 and above can register. We welcome participants from all 47 counties — both urban and rural areas — as diverse regional perspectives are valuable to our research clients.',
                },
                {
                  q: 'How long does each survey take?',
                  a: 'Most surveys on our platform are designed to take between 3 and 7 minutes. Each survey listing shows an estimated completion time before you begin, so you can plan accordingly.',
                },
                {
                  q: 'Is my personal data safe?',
                  a: 'Yes. Survey Pay Kenya operates in compliance with the Kenya Data Protection Act 2019. Your individual responses are aggregated and anonymised before being shared with research clients. We do not sell or share your personal contact details.',
                },
                {
                  q: 'What kinds of surveys are available?',
                  a: 'Our surveys cover a wide range of consumer topics relevant to daily life in Kenya: mobile network services, digital banking and mobile money, supermarket shopping habits, ride-hailing experiences, online shopping, and household energy usage.',
                },
                {
                  q: 'How do organisations use my feedback?',
                  a: 'Anonymised, aggregated research data is compiled into market research reports. Organisations use these reports to make strategic decisions about improving customer service, launching new products, and designing programmes that better serve Kenyan consumers.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{q}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── BOTTOM CTA ── */}
          <section className="bottom-cta">
            <div className="container bottom-cta-inner">
              <div>
                <div className="section-kicker">JOIN THE PANEL TODAY</div>
                <h2>Help shape better services for Kenya.</h2>
                <p>
                  Register your free account and start sharing your consumer opinions on the products and
                  services you use every day. Your voice helps organisations build better solutions for all
                  Kenyans.
                </p>
              </div>
              <Button className="hero-primary" onClick={start}>
                Join Free & Start Surveys <ArrowUpRight />
              </Button>
            </div>
          </section>
        </main>
      ) : (
        <main className="app-main container">
          <aside className="app-sidebar">
            <div className="sidebar-top">
              <div className="sidebar-label">WORKSPACE</div>
              <NavButton icon={Home} label="Overview" active={view === 'home'} onClick={() => navigate('home')} />
              <NavButton icon={Search} label="Explore surveys" active={view === 'surveys'} onClick={() => navigate('surveys')} />
              <NavButton icon={Wallet} label="My wallet" active={view === 'wallet'} onClick={() => navigate('wallet')} />
              <NavButton icon={Sparkles} label="Upgrade account" active={false} onClick={() => setModal('upgrade')} />
              <NavButton icon={UserRound} label="My profile" active={view === 'profile'} onClick={() => navigate('profile')} />
            </div>
            <div className="sidebar-help">
              <span className="help-icon">
                <HelpCircle />
              </span>
              <strong>Good to know</strong>
              <p>This is a concept preview. All rewards and payment steps are simulated.</p>
            </div>
          </aside>

          <div className="app-content">
            {view === 'home' && (
              <>
                <div className="app-topline">
                  <div className="section-kicker">⚡ LIVE REWARDS PORTAL · INSTANT M-PESA PAYOUTS</div>
                  <span className="preview-badge">
                    <span className="demo-dot" /> Demo account · {plan || 'Free Tier'}
                  </span>
                </div>
                <div className="greeting">
                  <div>
                    <h1>
                      Karibu Champ, ready to cash in? 💸
                    </h1>
                    <p>Your opinion is real currency. Complete free surveys to pocket your first KSh 2,000, or unlock premium studies for unlimited daily payouts!</p>
                  </div>
                  <Button variant="outline" className="notification-button" aria-label="Notifications" onClick={() => navigate('profile')}>
                    <Bell />
                  </Button>
                </div>

                <div className="overview-grid">
                  <div className="balance-panel">
                    <div className="balance-top">
                      <span>YOUR DEMO BALANCE</span>
                      <span className="balance-icon">
                        <Wallet />
                      </span>
                    </div>
                    <div className="balance-number">
                      <small>KSh</small> {balance.toLocaleString()}
                    </div>
                    <p>Simulated credits · Min withdrawal: KSh 2,500 · Tier limit: KSh {currentDailyLimit.toLocaleString()}/day</p>
                    <div className="balance-bottom">
                      <span>
                        <span className="pulse-dot" /> {activated ? `Active (${plan || 'Free Tier'})` : 'Activation required'}
                      </span>
                      <Button onClick={() => navigate('wallet')}>
                        Withdraw to M-Pesa <ArrowUpRight />
                      </Button>
                    </div>
                  </div>

                  <div className="stats-panel">
                    <div className="mini-stat">
                      <span className="mini-stat-icon">
                        <CheckCircle2 />
                      </span>
                      <div>
                        <span>COMPLETED SURVEYS</span>
                        <strong>{completed.length.toString().padStart(2, '0')}</strong>
                        <small>5 questions per survey</small>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-icon amber">
                        <Zap />
                      </span>
                      <div>
                        <span>DEMO REWARDS EARNED</span>
                        <strong>KSh {earned.toLocaleString()}</strong>
                        <small>KSh 150 each · Free max KSh 2,000</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dedicated M-Pesa Withdrawal Card on Home View */}
                <div className="mpesa-withdraw-card mt-4 mb-4">
                  <div className="mpesa-header-row">
                    <div className="mpesa-logo-badge">
                      <img src={brandLogos.mpesa} alt="M-Pesa" />
                      <span>M-Pesa Express Payouts</span>
                    </div>
                    <div className="partner-logos-strip">
                      <img src={brandLogos.safaricom} alt="Safaricom" title="Safaricom" className="partner-logo-pill" />
                      <img src={brandLogos.equity} alt="Equity Bank" title="Equity Bank" className="partner-logo-pill" />
                      <img src={brandLogos.kcb} alt="KCB Bank" title="KCB Bank" className="partner-logo-pill" />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 mb-3">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Mobile Money Channel (Kenya)
                    </div>
                    Linked Number: <strong>{phone || '0712 345 678'}</strong> · Minimum: <strong>KSh 2,500</strong> · Free Tier Limit: <strong>KSh 3,000/day</strong>
                  </div>

                  <Button
                    className="card-action w-full py-2.5 font-bold"
                    onClick={() => {
                      setWithdrawAmount(balance >= 2500 ? String(balance) : '2500');
                      setWithdrawError('');
                      setModal('withdraw');
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Withdraw to M-Pesa
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>


                <div className="app-section-head">
                  <div>
                    <div className="section-kicker">AVAILABLE & LOCKED SURVEYS</div>
                    <h2>
                      Surveys for you <span className="heading-flower">✳</span>
                    </h2>
                  </div>
                  <Button variant="ghost" className="text-link" onClick={() => navigate('surveys')}>
                    View all ({surveyData.length}) <ArrowRight />
                  </Button>
                </div>

                <div className="survey-grid app-survey-grid">
                  {surveyData.map(s => (
                    <SurveyCardItem
                      key={s.id}
                      survey={s}
                      completed={completed.includes(s.id)}
                      plan={plan}
                      unlockedSurveyIds={unlockedSurveyIds}
                      freeSurveyEarnings={freeSurveyEarnings}
                      onClick={() => openSurvey(s)}
                    />
                  ))}
                </div>

                <div className="app-section-head categories-heading">
                  <div>
                    <div className="section-kicker">GO FURTHER</div>
                    <h2>Explore collections</h2>
                  </div>
                  <Button variant="ghost" className="text-link" onClick={() => navigate('surveys')}>
                    See all <ArrowRight />
                  </Button>
                </div>

                <CategoryGrid
                  activated={activated}
                  unlocked={unlocked}
                  onChoose={i => {
                    setSelectedCategory(i);
                    setModal('unlock');
                  }}
                />
              </>
            )}

            {view === 'surveys' && (
              <>
                <div className="app-topline">
                  <div className="section-kicker">YOUR SPACE / SURVEYS</div>
                  <span className="preview-badge">
                    <span className="demo-dot" /> {surveyData.length} Sample listings
                  </span>
                </div>
                <div className="page-title">
                  <h1>
                    Explore paid survey<span className="heading-flower">✳</span>
                  </h1>
                  <p className="font-semibold text-emerald-800 mb-1">
                    Get paid by top companies: KCB, Safaricom, Jumia
                  </p>
                  <p>Each survey has at least 5 multiple-choice questions. Select answers to earn KSh 150 each!</p>
                </div>

                {/* Balance & M-Pesa Cards at Top of Surveys Page */}
                <div className="overview-grid mt-3 mb-4">
                  <div className="balance-panel">
                    <div className="balance-top">
                      <span>YOUR AVAILABLE BALANCE</span>
                      <span className="balance-icon">
                        <Wallet />
                      </span>
                    </div>
                    <div className="balance-number">
                      <small>KSh</small> {balance.toLocaleString()}
                    </div>
                    <p>Current Plan: <strong>{plan || 'Free Tier'}</strong> · Daily Limit: KSh {currentDailyLimit.toLocaleString()}/day</p>
                    <div className="balance-bottom">
                      <span>Min withdrawal: KSh 2,500</span>
                      <Button onClick={() => {
                        setWithdrawAmount(balance >= 2500 ? String(balance) : '2500');
                        setWithdrawError('');
                        setModal('withdraw');
                      }}>
                        Withdraw to M-Pesa <ArrowUpRight />
                      </Button>
                    </div>
                  </div>

                  <div className="stats-panel">
                    <div className="mini-stat">
                      <span className="mini-stat-icon">
                        <CheckCircle2 />
                      </span>
                      <div>
                        <span>COMPLETED SURVEYS</span>
                        <strong>{completed.length.toString().padStart(2, '0')}</strong>
                        <small>5 questions per survey</small>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-icon amber">
                        <Zap />
                      </span>
                      <div>
                        <span>REWARDS EARNED</span>
                        <strong>KSh {earned.toLocaleString()}</strong>
                        <small>KSh 150 each · Free max KSh 2,000</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mpesa-withdraw-card mb-4">
                  <div className="mpesa-header-row">
                    <div className="mpesa-logo-badge">
                      <img src={brandLogos.mpesa} alt="M-Pesa" />
                      <span>M-Pesa Express Payouts</span>
                    </div>
                    <div className="partner-logos-strip">
                      <img src={brandLogos.safaricom} alt="Safaricom" title="Safaricom" className="partner-logo-pill" />
                      <img src={brandLogos.equity} alt="Equity Bank" title="Equity Bank" className="partner-logo-pill" />
                      <img src={brandLogos.kcb} alt="KCB Bank" title="KCB Bank" className="partner-logo-pill" />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 mb-3">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Mobile Money Channel (Kenya)
                    </div>
                    Linked Number: <strong>{phone || '0712 345 678'}</strong> · Minimum: <strong>KSh 2,500</strong> · Free Tier Limit: <strong>KSh 3,000/day</strong>
                  </div>

                  {(!plan || plan === 'Free') && balance > 3000 && (
                    <div className="limit-alert-box mb-3">
                      <strong>
                        <AlertTriangle className="w-4 h-4 text-amber-600 inline" /> Account Tier Limit Notice
                      </strong>
                      <p className="mt-1 text-xs text-amber-900">
                        You can't withdraw more than KSh 3,000 a day on a free account. Your account has KSh {balance.toLocaleString()} which is more than your account tier limit. Upgrade to increase your daily withdrawal limit since there is more money in your account than the account tier limit.
                      </p>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded"
                          onClick={() => setModal('upgrade')}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Upgrade Account Now
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    className="card-action w-full py-2.5 font-bold"
                    onClick={() => {
                      setWithdrawAmount(balance >= 2500 ? String(balance) : '2500');
                      setWithdrawError('');
                      setModal('withdraw');
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Withdraw to M-Pesa
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="survey-tools">
                  <div className="search-field flex items-center justify-between w-full max-w-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        aria-label="Search surveys by brand name or reward amount"
                        placeholder="Search by brand name or reward amount (e.g. Safaricom, 150, 600)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="filter-scroll">
                    {['All', 'Technology', 'Finance', 'Lifestyle', 'Travel', 'Entertainment'].map(f => (
                      <Button
                        key={f}
                        className={filter === f ? 'filter-active' : 'filter-button'}
                        variant="ghost"
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>

                  {/* Quick Amount Search Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground pt-1">
                    <span className="font-semibold text-gray-500 text-[11px]">Filter by Reward Amount:</span>
                    {['150', '600', '650', '700', '750', '800', '900', '1000'].map(amt => {
                      const isSelected = search.trim() === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                          onClick={() => setSearch(prev => prev.trim() === amt ? '' : amt)}
                        >
                          KSh {Number(amt).toLocaleString()}
                        </button>
                      );
                    })}
                    {search && (
                      <button
                        type="button"
                        className="text-[11px] text-red-600 hover:text-red-700 underline font-semibold ml-1 cursor-pointer"
                        onClick={() => setSearch('')}
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </div>

                <div className="results-label">{filteredSurveys.length} SURVEYS DISPLAYED</div>
                <div className="survey-grid app-survey-grid">
                  {[...filteredSurveys].sort((a, b) => {
                    const aCompleted = completed.includes(a.id);
                    const bCompleted = completed.includes(b.id);
                    const aUnlocked = unlockedSurveyIds.includes(a.id);
                    const bUnlocked = unlockedSurveyIds.includes(b.id);

                    // 1. Newly unlocked (unlocked and not yet completed) appear at the top
                    if (aUnlocked && !aCompleted && !(bUnlocked && !bCompleted)) return -1;
                    if (bUnlocked && !bCompleted && !(aUnlocked && !aCompleted)) return 1;

                    // 2. Active uncompleted before completed
                    if (!aCompleted && bCompleted) return -1;
                    if (aCompleted && !bCompleted) return 1;

                    return 0;
                  }).map(s => (
                    <SurveyCardItem
                      key={s.id}
                      survey={s}
                      completed={completed.includes(s.id)}
                      plan={plan}
                      unlockedSurveyIds={unlockedSurveyIds}
                      freeSurveyEarnings={freeSurveyEarnings}
                      onClick={() => openSurvey(s)}
                    />
                  ))}
                </div>

                {filteredSurveys.length === 0 && (
                  <div className="empty-state">No surveys found. Try another search or category.</div>
                )}
              </>
            )}

            {view === 'wallet' && (
              <>
                <div className="app-topline">
                  <div className="section-kicker">YOUR SPACE / WALLET</div>
                  <span className="preview-badge">
                    <span className="demo-dot" /> Demo M-Pesa Wallet
                  </span>
                </div>
                <div className="page-title">
                  <h1>
                    Your wallet<span className="heading-flower">✳</span>
                  </h1>
                  <p>Manage your earnings, review M-Pesa limits and request withdrawals.</p>
                </div>

                <div className="wallet-layout">
                  <div className="wallet-main">
                    <div className="balance-panel wallet-balance">
                      <div className="balance-top">
                        <span>AVAILABLE BALANCE</span>
                        <span className="balance-icon">
                          <Wallet />
                        </span>
                      </div>
                      <div className="balance-number">
                        <small>KSh</small> {balance.toLocaleString()}
                      </div>
                      <p>
                        Current Plan: <strong>{plan || 'Free Tier'}</strong> · Daily Withdrawal Limit: KSh {currentDailyLimit.toLocaleString()}/day
                      </p>
                      <div className="balance-bottom">
                        <span>Min withdrawal: KSh 2,500</span>
                        <Button
                          onClick={() => {
                            setWithdrawAmount(balance >= 2500 ? String(balance) : '2500');
                            setWithdrawError('');
                            setModal('withdraw');
                          }}
                        >
                          Withdraw to M-Pesa <ArrowUpRight />
                        </Button>
                      </div>
                    </div>

                    {/* Dedicated M-Pesa Withdrawal Card */}
                    <div className="mpesa-withdraw-card">
                      <div className="mpesa-header-row">
                        <div className="mpesa-logo-badge">
                          <img src={brandLogos.mpesa} alt="M-Pesa" />
                          <span>M-Pesa Express Payouts</span>
                        </div>
                        <div className="partner-logos-strip">
                          <img src={brandLogos.safaricom} alt="Safaricom" title="Safaricom" className="partner-logo-pill" />
                          <img src={brandLogos.equity} alt="Equity Bank" title="Equity Bank" className="partner-logo-pill" />
                          <img src={brandLogos.kcb} alt="KCB Bank" title="KCB Bank" className="partner-logo-pill" />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 mb-3">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Verified Mobile Money Channel (Kenya)
                        </div>
                        Linked Number: <strong>{phone || '0712 345 678'}</strong> · Minimum: <strong>KSh 2,500</strong> · Free Tier Limit: <strong>KSh 3,000/day</strong>
                      </div>

                      {(!plan || plan === 'Free') && balance > 3000 && (
                        <div className="limit-alert-box">
                          <strong>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            Account Tier Limit Warning
                          </strong>
                          Your balance (KSh {balance.toLocaleString()}) exceeds the Free Tier daily limit of KSh 3,000. Upgrade your account to withdraw your full earnings in one transaction.
                          <div className="mt-2">
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => setModal('upgrade')}>
                              Upgrade Daily Limit <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button
                        className="card-action w-full py-2.5 font-bold"
                        onClick={() => {
                          setWithdrawAmount(balance >= 2500 ? String(balance) : '2500');
                          setWithdrawError('');
                          setModal('withdraw');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" /> Withdraw to M-Pesa
                        </span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="wallet-activity">
                      <div className="app-section-head">
                        <div>
                          <div className="section-kicker">YOUR ACTIVITY</div>
                          <h2>Recent activity</h2>
                        </div>
                      </div>
                      {completed.length === 0 && !activated ? (
                        <div className="activity-empty">
                          <span>
                            <Wallet />
                          </span>
                          <h3>Nothing here just yet</h3>
                          <p>Your sample survey rewards will show up here.</p>
                          <Button variant="outline" onClick={() => navigate('surveys')}>
                            Explore surveys <ArrowRight />
                          </Button>
                        </div>
                      ) : (
                        <div className="activity-list">
                          {completed.map(id => {
                            const s = surveyData.find(item => item.id === id);
                            return s ? (
                              <div key={id} className="activity-row">
                                <span className="activity-icon">
                                  <Check />
                                </span>
                                <div>
                                  <strong>{s.company} sample survey</strong>
                                  <small>Demo reward (5 questions)</small>
                                </div>
                                <b>+ KSh 150</b>
                              </div>
                            ) : null;
                          })}
                          {activated && (
                            <div className="activity-row">
                              <span className="activity-icon">
                                <Plus />
                              </span>
                              <div>
                                <strong>Account activation balance</strong>
                                <small>Simulated M-Pesa deposit</small>
                              </div>
                              <b>+ KSh {Number(amount).toLocaleString()}</b>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="wallet-aside">
                    <div className="wallet-info">
                      <span className="wallet-info-icon">
                        <ShieldCheck />
                      </span>
                      <h3>Account status</h3>
                      <strong>{activated ? `Active (${plan || 'Free Tier'})` : 'Not activated'}</strong>
                      <p>
                        {activated
                          ? `Your account is active. Daily withdrawal limit: KSh ${currentDailyLimit.toLocaleString()}.`
                          : 'Activate your account before attempting surveys to link your M-Pesa number.'}
                      </p>
                      {!activated ? (
                        <Button
                          className="dark-button"
                          onClick={() => {
                            setActivationStep(0);
                            setModal('activation');
                          }}
                        >
                          Activate account <ArrowRight />
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setModal('upgrade')}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Upgrade Tier
                        </Button>
                      )}
                    </div>

                    <div className="wallet-info soft">
                      <span className="wallet-info-icon">
                        <CreditCard />
                      </span>
                      <h3>Supported Channels</h3>
                      <p className="text-xs mb-3">Instant payouts simulated across all major Kenyan financial partners.</p>
                      <div className="flex gap-2">
                        <img src={brandLogos.mpesa} alt="M-Pesa" className="h-6 object-contain rounded" />
                        <img src={brandLogos.safaricom} alt="Safaricom" className="h-6 object-contain rounded" />
                        <img src={brandLogos.equity} alt="Equity" className="h-6 object-contain rounded" />
                        <img src={brandLogos.kcb} alt="KCB" className="h-6 object-contain rounded" />
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )}

            {view === 'profile' && (
              <>
                <div className="app-topline">
                  <div className="section-kicker">YOUR SPACE / PROFILE</div>
                  <span className="preview-badge">
                    <span className="demo-dot" /> Demo account
                  </span>
                </div>
                <div className="page-title">
                  <h1>
                    Your space<span className="heading-flower">✳</span>
                  </h1>
                  <p>A snapshot of your journey with Survey Pay Kenya.</p>
                </div>
                <div className="profile-banner">
                  <div className="profile-avatar">SP</div>
                  <div>
                    <div className="section-kicker">SURVEY PAY KENYA PRO</div>
                    <h2>Welcome, explorer</h2>
                    <p>Phone: {phone || 'Not linked'}</p>
                  </div>
                  <span className="profile-status">{activated ? `Active (${plan || 'Free Tier'})` : 'Not activated'}</span>
                </div>
                <div className="profile-stats">
                  <div>
                    <span>SURVEYS COMPLETED</span>
                    <strong>{completed.length.toString().padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <span>DEMO CREDITS</span>
                    <strong>KSh {balance.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>ACCOUNT PLAN</span>
                    <strong>{plan || 'Free Tier'}</strong>
                  </div>
                </div>

                <div className="app-section-head">
                  <div>
                    <div className="section-kicker">ACCOUNT OPTIONS</div>
                    <h2>Preferences</h2>
                  </div>
                </div>
                <div className="profile-options">
                  <Button variant="ghost" onClick={() => navigate('wallet')}>
                    <span>
                      <Wallet /> Wallet & M-Pesa Withdrawals
                    </span>
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUpgrade(1);
                      setModal('upgrade');
                    }}
                  >
                    <span>
                      <Sparkles /> Upgrade Account (Basic, Lite, Platinum)
                    </span>
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActivationStep(0);
                      setModal('activation');
                    }}
                  >
                    <span>
                      <ShieldCheck /> Account Activation Status
                    </span>
                    <ChevronRight />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* STYLISH MODERN BOTTOM NAVIGATION BAR */}
          <nav className="bottom-nav" aria-label="App bottom navigation">
            <button
              onClick={() => navigate('home')}
              className={`bottom-nav-item nav-home ${view === 'home' ? 'active' : ''}`}
            >
              <Home />
              <span>Home</span>
              {view === 'home' && <span className="bottom-nav-dot" />}
            </button>

            <button
              onClick={() => navigate('surveys')}
              className={`bottom-nav-item nav-surveys ${view === 'surveys' ? 'active' : ''}`}
            >
              <Search />
              <span>Surveys</span>
              {view === 'surveys' && <span className="bottom-nav-dot" />}
            </button>

            <button
              onClick={() => setModal('upgrade')}
              className="bottom-nav-item nav-upgrade"
            >
              <Sparkles />
              <span>Upgrade</span>
              <span className="bottom-nav-badge">HOT</span>
            </button>

            <button
              onClick={() => navigate('wallet')}
              className={`bottom-nav-item nav-wallet ${view === 'wallet' ? 'active' : ''}`}
            >
              <Wallet />
              <span>Wallet</span>
              {view === 'wallet' && <span className="bottom-nav-dot" />}
            </button>

            <button
              onClick={() => navigate('profile')}
              className={`bottom-nav-item nav-profile ${view === 'profile' ? 'active' : ''}`}
            >
              <UserRound />
              <span>Profile</span>
              {view === 'profile' && <span className="bottom-nav-dot" />}
            </button>
          </nav>
        </main>
      )}

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="brand-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
            <strong>SurveyPay Kenya.</strong>
            <span>Consumer Research & Opinion Panels</span>
          </div>

          <div className="footer-links flex flex-wrap items-center justify-center gap-4 text-xs my-2">
            <button
              type="button"
              className="text-gray-600 hover:text-emerald-700 underline underline-offset-4 transition-colors font-medium"
              onClick={() => setModal('privacy')}
            >
              Privacy Policy
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              className="text-gray-600 hover:text-emerald-700 underline underline-offset-4 transition-colors font-medium"
              onClick={() => setModal('terms')}
            >
              Terms of Service
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              className="text-gray-600 hover:text-emerald-700 underline underline-offset-4 transition-colors font-medium"
              onClick={() => setModal('disclaimer')}
            >
              Participation Guidelines
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              className="text-gray-600 hover:text-emerald-700 underline underline-offset-4 transition-colors font-medium"
              onClick={() => setModal('contact')}
            >
              Contact Support
            </button>
          </div>

          <p className="text-xs text-gray-500 max-w-xl text-center mx-auto my-1 leading-relaxed">
            Survey Pay Kenya is an independent market research panel. Survey participation is voluntary. Brand names and logos are trademarks of their respective owners and used solely for consumer research categorization.
          </p>
          <span className="text-xs text-gray-400">© 2026 SurveyPay Kenya. All rights reserved.</span>
        </div>
      </footer>

      {/* --- MODALS --- */}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Modal dialog"
          >
            <div className="modal-header">
              <span className="modal-brand">
                <span className="brand-mark">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>{' '}
                SurveyPay Kenya.
              </span>
              <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Close">
                <X />
              </Button>
            </div>

            {/* --- ACTIVATION MODAL --- */}
            {modal === 'activation' && (
              <div className="modal-body">
                {activated && activationStep !== 4 ? (
                  <>
                    <div className="modal-icon success">
                      <Check />
                    </div>
                    <div className="modal-kicker">ACCOUNT STATUS</div>
                    <h2>Account is already activated!</h2>
                    <p>Your M-Pesa account ({phone}) is successfully linked. You can take free surveys and earn rewards.</p>
                    <Button className="modal-primary" onClick={closeModal}>
                      Start Taking Surveys <ArrowRight />
                    </Button>
                  </>
                ) : activationStep === 0 ? (
                  // Step 0: Pop "Activate your account to enable mpesa withdrawals before attempting the survey so that your earnings dont get lost"
                  <>
                    <div className="modal-icon text-emerald-600 bg-emerald-50">
                      <LockKeyhole />
                    </div>
                    <div className="modal-kicker text-emerald-700">REQUIRED BEFORE ATTEMPTING SURVEYS</div>
                    <h2>Activate your account to enable M-Pesa withdrawals</h2>
                    <p className="text-gray-600">
                      Activate your account before attempting the survey so that your earnings don't get lost.
                    </p>

                    <div className="hero-activation-box">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={brandLogos.mpesa} alt="M-Pesa" className="h-7 rounded" />
                        <img src={brandLogos.safaricom} alt="Safaricom" className="h-6 rounded" />
                        <span className="text-xs font-bold text-emerald-800 ml-auto bg-emerald-100 px-2 py-0.5 rounded">
                          Instant Payout Verified
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 m-0">
                        Linking your phone number ensures your KSh 150 reward per survey is securely credited and withdrawable via M-Pesa.
                      </p>
                    </div>

                    <div className="modal-note">
                      <ShieldCheck />
                      <span>This is a prototype simulation. All transactions and wallet balances are illustrative demo data.</span>
                    </div>

                    <Button className="card-action w-full py-3" onClick={() => setActivationStep(1)}>
                      <span>Activate Account</span> <ArrowRight />
                    </Button>
                    <Button variant="ghost" className="modal-secondary" onClick={closeModal}>
                      Maybe later
                    </Button>
                  </>
                ) : activationStep === 1 ? (
                  // Step 1: "To enable withdrawal to mpesa link your mpesa to your survey account" then "Confirm account"
                  <>
                    <div className="modal-icon">
                      <Wallet />
                    </div>
                    <div className="modal-kicker">STEP 01 / 03</div>
                    <h2>To enable withdrawal to M-Pesa, link your M-Pesa to your survey account</h2>
                    <p>Link your Safaricom M-Pesa mobile line to receive instant survey disbursements.</p>

                    <div className="mpesa-chip">
                      <img src={brandLogos.mpesa} alt="M-Pesa" className="w-10 h-10 object-contain rounded" />
                      <div>
                        <strong>M-Pesa Express Linked Account</strong>
                        <small>Direct disbursements channel</small>
                      </div>
                      <span className="chip-demo">SECURE</span>
                    </div>

                    <Button className="card-action w-full py-3" onClick={() => setActivationStep(2)}>
                      <span>Confirm Account</span> <ArrowRight />
                    </Button>
                    <Button variant="ghost" className="modal-secondary" onClick={() => setActivationStep(0)}>
                      <ChevronLeft /> Back
                    </Button>
                  </>
                ) : activationStep === 2 ? (
                  // Step 2: "Enter account confirmation amount"
                  // "min amount is 50 in that screen"
                  // "tell them the amount will be added to your account balance you can use it to unlock more surveys or withdraw it with your earnings"
                  // "another before the action button: this will update the status of your account to activated"
                  // "user will key amount and click confirm account they will enter phone number mpesa"
                  <>
                    <div className="modal-icon">
                      <CircleDollarSign />
                    </div>
                    <div className="modal-kicker">STEP 02 / 03</div>
                    <h2>Enter account confirmation amount</h2>
                    <p>
                      The amount will be added to your account balance. You can use it to unlock more surveys or withdraw it with your earnings.
                    </p>

                    <label className="field-label" htmlFor="confirmAmount">
                      CONFIRMATION AMOUNT (KSH)
                    </label>
                    <div className="amount-field">
                      <span>KSh</span>
                      <input
                        id="confirmAmount"
                        type="number"
                        value={amount}
                        onChange={e => {
                          setAmount(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter amount"
                      />
                    </div>

                    <label className="field-label" htmlFor="confirmPhone">
                      M-PESA REGISTERED PHONE NUMBER
                    </label>
                    <div className="amount-field">
                      <span>🇰🇪</span>
                      <input
                        id="confirmPhone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value);
                          setError('');
                        }}
                        placeholder="07XX XXX XXX or 01XX XXX XXX"
                      />
                    </div>

                    {error && <p className="field-error">{error}</p>}

                    <div className="modal-note border-emerald-300 bg-emerald-50 text-emerald-900 mt-4">
                      <ShieldCheck className="text-emerald-600" />
                      <span>
                        <strong>Note:</strong> This will update the status of your account to activated.
                      </span>
                    </div>

                    <Button
                      className="card-action w-full py-3"
                      disabled={isSimulatingStk}
                      onClick={triggerActivationSTK}
                    >
                      <span>{isSimulatingStk ? 'Sending M-Pesa STK...' : 'Confirm Account & Complete with M-Pesa'}</span> <ArrowRight />
                    </Button>
                    <Button variant="ghost" className="modal-secondary" onClick={() => setActivationStep(1)}>
                      <ChevronLeft /> Back
                    </Button>
                  </>
                ) : activationStep === 3 ? (
                  // Real M-Pesa STK push waiting screen
                  <div className="text-center py-6">
                    <img src={brandLogos.mpesa} alt="M-Pesa" className="h-12 mx-auto mb-4 rounded shadow-sm" />
                    <h2 className="text-xl font-bold mb-2">M-Pesa STK Push Sent!</h2>
                    <p className="text-sm font-semibold text-emerald-800 mb-1">
                      Check your phone ({phone})
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                      A prompt for <strong>KSh {Number(amount).toLocaleString()}</strong> was dispatched to your Safaricom SIM. Please enter your M-Pesa PIN to complete activation.
                    </p>
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xs text-emerald-700 font-semibold mb-4">
                      {stkStatusMsg || 'Waiting for PIN confirmation...'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 hover:text-red-600"
                      onClick={() => {
                        setIsSimulatingStk(false);
                        setActivationStep(2);
                      }}
                    >
                      Didn't get prompt? Try again
                    </Button>
                  </div>
                ) : (
                  // Step 4: Success / Activated!
                  <>
                    <div className="modal-icon success">
                      <Check />
                    </div>
                    <div className="modal-kicker">DEMO ACTIVATION COMPLETED</div>
                    <h2>Account Successfully Activated!</h2>
                    <p>
                      Your M-Pesa number <strong>{phone}</strong> is now verified and linked. KSh {Number(amount).toLocaleString()} has been added to your wallet balance.
                    </p>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 mb-4">
                      ✓ Free surveys unlocked (Earn up to KSh 2,000)
                      <br />
                      ✓ Instant M-Pesa withdrawal channel enabled
                      <br />
                      ✓ You can now take surveys!
                    </div>
                    <Button
                      className="card-action w-full py-3"
                      onClick={() => {
                        closeModal();
                        if (activeSurvey) openSurvey(activeSurvey);
                      }}
                    >
                      <span>Start Attempting Free Surveys</span> <ArrowRight />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* --- SURVEY QUESTIONS MODAL (MINIMUM 5 QUESTIONS) --- */}
            {modal === 'survey' && (
              <div className="modal-body survey-modal">
                {surveyDone ? (
                  <div className="payment-received-card">
                    <div className="payment-celebrate-icon">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="payment-badge-pill">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      M-PESA INSTANT CREDIT
                    </div>
                    <div className="payment-amount-display">
                      <small>+KSh</small>
                      <strong>{(activeSurvey.potential || 150).toLocaleString()}</strong>
                    </div>
                    <h2>You have received KSh {(activeSurvey.potential || 150).toLocaleString()}!</h2>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-3">
                      Credited directly to your Survey Pay Kenya wallet balance for completing the <strong>{activeSurvey.company}</strong> verified study.
                    </p>

                    <div className="payment-receipt-box">
                      <div className="receipt-row">
                        <span>Transaction Ref:</span>
                        <strong>MP{Math.floor(10000000 + Math.random() * 90000000)}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Study Partner:</span>
                        <strong>{activeSurvey.company} (Kenya)</strong>
                      </div>
                      <div className="receipt-row">
                        <span>New Wallet Balance:</span>
                        <strong className="text-emerald-700 font-bold">KSh {balance.toLocaleString()}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Payout Channel:</span>
                        <strong className="text-emerald-700 font-bold">✓ M-Pesa Express Linked</strong>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <Button
                        className="card-action w-full py-3 text-sm font-bold"
                        onClick={() => {
                          closeModal();
                          navigate('surveys');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Continue to Next Survey
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="modal-secondary text-xs"
                        onClick={() => {
                          closeModal();
                          navigate('wallet');
                        }}
                      >
                        Check Wallet Balance &amp; Withdraw
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="survey-modal-top">
                      {activeSurvey.logo ? (
                        <img src={activeSurvey.logo} alt={activeSurvey.company} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                      ) : (
                        <div className={`company-logo ${activeSurvey.tone}`}>{activeSurvey.initials}</div>
                      )}
                      <div>
                        <strong>{activeSurvey.company}</strong>
                        <small className="text-emerald-700 font-bold">Earn KSh {(activeSurvey.potential || 150).toLocaleString()} · 5 Questions</small>
                      </div>
                      <span className="card-trigger-pill free ml-auto">
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> +KSh {(activeSurvey.potential || 150).toLocaleString()}
                      </span>
                    </div>

                    <div className="question-progress">
                      <span>
                        QUESTION {questionIndex + 1} OF {activeSurvey.questions.length}
                      </span>
                      <span>{Math.round(((questionIndex + 1) / activeSurvey.questions.length) * 100)}%</span>
                    </div>

                    <div className="progress-track">
                      <div style={{ width: `${((questionIndex + 1) / activeSurvey.questions.length) * 100}%` }} />
                    </div>

                    <h2 className="text-lg font-bold mb-4">{activeSurvey.questions[questionIndex]?.question}</h2>

                    {/* SELECT ONLY: NO WRITING ANSWERS, MODERN INTERACTIVE */}
                    <div className="answer-list">
                      {activeSurvey.questions[questionIndex]?.options.map(option => (
                        <Button
                          key={option}
                          variant="ghost"
                          className={selected === option ? 'answer selected' : 'answer'}
                          onClick={() => handleSelectOption(option)}
                        >
                          <span>{option}</span>
                          <span className="answer-radio">{selected === option && <Check />}</span>
                        </Button>
                      ))}
                    </div>

                    <div className="text-center text-xs text-muted-foreground my-3">
                      Tap any answer to record &amp; proceed automatically
                    </div>

                    {questionIndex > 0 && (
                      <Button
                        variant="ghost"
                        className="modal-secondary"
                        onClick={() => {
                          setQuestionIndex(questionIndex - 1);
                          setSelected(null);
                        }}
                      >
                        <ChevronLeft /> Previous question
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* --- RUN OUT OF FREE SURVEYS / UNLOCK SURVEYS POPUP --- */}
            {modal === 'run_out_free' && (
              <div className="modal-body">
                <div className="modal-icon text-amber-600 bg-amber-50">
                  <LockKeyhole />
                </div>
                <div className="modal-kicker text-amber-700">SURVEY LIMIT REACHED</div>
                <h2>You have run out of free surveys! Unlock more surveys and increase your earnings</h2>
                <p>
                  Free accounts earn up to KSh 2,000 on free surveys. Unlock premium bundles below with multiple survey types (5 questions each) to continue answering and multiplying your earnings!
                </p>

                <div className="unlock-bundles-container">
                  {UNLOCK_BUNDLES.map(bundle => {
                    const allUnlocked = bundle.surveyIds.every(id => unlockedSurveyIds.includes(id));
                    const includedSurveys = surveyData.filter(s => bundle.surveyIds.includes(s.id));

                    return (
                      <div key={bundle.price} className={`unlock-bundle-card ${allUnlocked ? 'bundle-unlocked' : ''}`}>
                        <div className="bundle-header">
                          <div>
                            <span className="bundle-badge">{bundle.badge}</span>
                            <h3 className="bundle-title">{bundle.headline}</h3>
                            <div className="bundle-sub">
                              Includes <strong>{bundle.surveyTypesCount} Survey Types</strong> · 5 Questions each
                            </div>
                          </div>
                          <div className="bundle-price-tag">
                            <span className="text-xs text-gray-500 font-semibold">Unlock Fee</span>
                            <strong>KSh {bundle.price}</strong>
                          </div>
                        </div>

                        {/* Survey types inside this unlocked tier */}
                        <div className="bundle-surveys-list">
                          {includedSurveys.map(s => (
                            <div key={s.id} className="bundle-survey-row">
                              <img src={s.logo || s.image} alt={s.company} className="bundle-brand-logo" />
                              <div className="bundle-survey-info">
                                <span className="bundle-survey-name">{s.company}</span>
                                <span className="bundle-survey-meta">5 Questions · Verified Study</span>
                              </div>
                              <span className="bundle-survey-earning-pill">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> +KSh {s.potential.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bundle-footer">
                          <div className="bundle-potential-sum">
                            <span>Bundle Total Potential:</span>
                            <strong>+KSh {bundle.totalPotential.toLocaleString()}</strong>
                          </div>
                          <Button
                            className="unlock-bundle-btn"
                            disabled={isSimulatingStk || allUnlocked}
                            onClick={() => unlockBundle(bundle)}
                          >
                            {isSimulatingStk
                              ? 'Confirming with M-Pesa...'
                              : allUnlocked
                              ? '✓ All Unlocked'
                              : `Unlock All ${bundle.surveyTypesCount} Surveys (KSh ${bundle.price})`}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {stkStatusMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 mt-3 flex items-center gap-2">
                    <span className="animate-pulse">📡</span> {stkStatusMsg}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 mt-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" /> {error}
                  </div>
                )}

                <Button variant="ghost" className="modal-secondary mt-3" onClick={closeModal}>
                  Close
                </Button>
              </div>
            )}

            {/* --- UPGRADE ACCOUNT MODAL --- */}
            {modal === 'upgrade' && (
              <div className="modal-body">
                <div className="modal-icon text-purple-600 bg-purple-50">
                  <Sparkles />
                </div>
                <div className="modal-kicker text-purple-700">ACCOUNT UPGRADE PACKAGES</div>
                <h2>Upgrade your account</h2>
                <p>
                  Free accounts have a KSh 3,000 daily withdrawal limit. Upgrade your tier to increase your daily limits and unlock high-paying surveys.
                </p>

                <div className="upgrade-cards-grid">
                  {upgradePackages.map((pkg, idx) => (
                    <div
                      key={pkg.name}
                      className={`pkg-card ${selectedUpgrade === idx ? 'selected' : ''}`}
                      onClick={() => setSelectedUpgrade(idx)}
                    >
                      <span className="pkg-tag">{pkg.badge}</span>
                      <strong className="text-sm font-bold text-gray-900">{pkg.name} Tier</strong>
                      <div className="pkg-price">KSh {pkg.price}</div>
                      <div className="pkg-features">
                        {pkg.features.map(f => (
                          <div key={f}>✓ {f}</div>
                        ))}
                      </div>
                      <Button
                        className="card-action w-full mt-3 py-2 text-xs font-bold"
                        disabled={isSimulatingStk}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmUpgrade(idx);
                        }}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          {isSimulatingStk && selectedUpgrade === idx
                            ? 'Processing STK...'
                            : `Pay KSh ${pkg.price} & Activate`}
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>

                {stkStatusMsg && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 my-3 flex items-center gap-2">
                    <span className="animate-pulse">📡</span> {stkStatusMsg}
                  </div>
                )}

                <div className="modal-note border-purple-200 bg-purple-50 text-purple-900">
                  <ShieldCheck className="text-purple-600" />
                  <span>
                    Upgrading updates your withdrawal limit to up to KSh {(upgradePackages[selectedUpgrade]?.dailyLimit ?? 10000).toLocaleString()}/day and unlocks all surveys.
                  </span>
                </div>

                <Button variant="ghost" className="modal-secondary mt-2" onClick={closeModal}>
                  Close
                </Button>
              </div>
            )}

            {/* --- AUTH MODAL (SIGNUP / LOGIN) --- */}
            {modal === 'auth' && (
              <div className="modal-body">
                <div className="modal-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                  <ShieldCheck />
                </div>
                <div className="modal-kicker text-emerald-700">
                  {authMode === 'signup' ? 'JOIN SURVEY PAY KENYA' : 'WELCOME BACK'}
                </div>
                <h2>{authMode === 'signup' ? 'Create your account to start earning' : 'Log in to your account'}</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {authMode === 'signup'
                    ? 'Register with your active M-Pesa phone number to receive instant survey credits and payouts.'
                    : 'Access your saved surveys, wallet balance, and M-Pesa withdrawal channel.'}
                </p>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="field-label" htmlFor="authEmail">EMAIL ADDRESS</label>
                    <input
                      id="authEmail"
                      type="email"
                      className="amount-field border rounded px-3 py-2 w-full text-sm"
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={e => { setAuthEmail(e.target.value); setAuthError(''); }}
                      autoComplete="email"
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="field-label" htmlFor="authPhone">M-PESA PHONE NUMBER</label>
                      <input
                        id="authPhone"
                        type="tel"
                        className="amount-field border rounded px-3 py-2 w-full text-sm"
                        placeholder="0712 345 678"
                        value={authPhone}
                        onChange={e => { setAuthPhone(e.target.value); setAuthError(''); }}
                        autoComplete="tel"
                      />
                    </div>
                  )}

                  <div>
                    <label className="field-label" htmlFor="authPassword">PASSWORD</label>
                    <input
                      id="authPassword"
                      type="password"
                      className="amount-field border rounded px-3 py-2 w-full text-sm"
                      placeholder={authMode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
                      value={authPassword}
                      onChange={e => { setAuthPassword(e.target.value); setAuthError(''); }}
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }}
                    />
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <Button
                    className="card-action w-full py-3 mt-1 font-bold"
                    onClick={handleAuth}
                    disabled={authSubmitting}
                  >
                    {authSubmitting
                      ? (authMode === 'signup' ? 'Creating Account...' : 'Logging in...')
                      : (authMode === 'signup' ? 'Create Account & Start Earning' : 'Log In & Continue')}
                    <ArrowRight />
                  </Button>

                  <div className="text-center text-xs text-gray-500 mt-2">
                    {authMode === 'signup' ? (
                      <>
                        Already registered?{' '}
                        <button
                          type="button"
                          className="text-emerald-700 font-bold underline ml-1"
                          onClick={() => { setAuthMode('login'); setAuthError(''); }}
                        >
                          Log in here
                        </button>
                      </>
                    ) : (
                      <>
                        New to Survey Pay Kenya?{' '}
                        <button
                          type="button"
                          className="text-emerald-700 font-bold underline ml-1"
                          onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                        >
                          Sign up free
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- WITHDRAW TO M-PESA MODAL --- */}
            {modal === 'withdraw' && (
              <div className="modal-body">
                <div className="modal-icon">
                  <Wallet />
                </div>
                <div className="modal-kicker">M-PESA PAYOUT CHANNEL</div>
                <h2>Withdraw to M-Pesa</h2>
                <p>
                  Minimum withdrawal: <strong>KSh 2,500</strong>. Available balance: <strong>KSh {balance.toLocaleString()}</strong>.
                </p>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-md mb-4">
                  <img src={brandLogos.mpesa} alt="M-Pesa" className="h-7 rounded" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">Phone: {phone || '0712 345 678'}</div>
                    <div className="text-xs text-gray-500">Tier: {plan || 'Free'} (Daily limit: KSh {currentDailyLimit.toLocaleString()})</div>
                  </div>
                </div>

                <label className="field-label" htmlFor="withdrawInput">
                  AMOUNT TO WITHDRAW (KSH)
                </label>
                <div className="amount-field">
                  <span>KSh</span>
                  <input
                    id="withdrawInput"
                    type="number"
                    min="2500"
                    value={withdrawAmount}
                    onChange={e => {
                      setWithdrawAmount(e.target.value);
                      setWithdrawError('');
                    }}
                    placeholder="2500"
                  />
                </div>

                {stkStatusMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 my-2 flex items-center gap-2">
                    <span className="animate-pulse">📡</span> {stkStatusMsg}
                  </div>
                )}

                {withdrawError && (
                  <div className="limit-alert-box mt-3">
                    <strong>
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      Notice
                    </strong>
                    {withdrawError}
                    {withdrawError.includes('free account') && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                          onClick={() => {
                            closeModal();
                            setModal('upgrade');
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Upgrade Account Now
                        </Button>
                      </div>
                    )}
                    {/* Continue with surveys button to meet withdrawal threshold */}
                    <div className="mt-3 pt-2 border-t border-amber-200">
                      <Button
                        size="sm"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2"
                        onClick={() => {
                          closeModal();
                          navigate('surveys');
                        }}
                      >
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Continue with Surveys to Meet Withdrawal Threshold <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {withdrawSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 my-4">
                    <strong>✓ M-Pesa Transfer Completed!</strong>
                    <br />
                    Transaction Ref: MP{Math.floor(10000000 + Math.random() * 90000000)} confirmed. KSh {Number(withdrawAmount).toLocaleString()} dispatched to {phone}.
                  </div>
                )}

                {!withdrawSuccess ? (
                  <Button
                    className="card-action w-full py-3 mt-4"
                    disabled={isSimulatingStk}
                    onClick={handleWithdraw}
                  >
                    <span>{isSimulatingStk ? 'Sending to M-Pesa...' : 'Confirm Withdrawal to M-Pesa'}</span>
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button className="modal-primary w-full mt-4" onClick={closeModal}>
                    Done
                  </Button>
                )}

                <Button variant="ghost" className="modal-secondary" onClick={closeModal}>
                  Cancel
                </Button>
              </div>
            )}

            {/* --- UNLOCK COLLECTION MODAL --- */}
            {modal === 'unlock' && (
              <div className="modal-body">
                <div className="modal-icon">
                  <LockKeyhole />
                </div>
                <div className="modal-kicker">COLLECTION PREVIEW</div>
                <h2>{categories[selectedCategory]?.name ?? 'Category Collection'}</h2>
                <p>
                  This collection illustrates how more opportunities might be organized. Potential earnings of up to KSh{' '}
                  {(categories[selectedCategory]?.potential ?? 2000).toLocaleString()} are simulated examples.
                </p>
                <div className="unlock-summary">
                  <span>Illustrative unlock amount</span>
                  <strong>KSh {categories[selectedCategory]?.price ?? 0}</strong>
                </div>
                <div className="modal-note">
                  <ShieldCheck />
                  <span>No charge is made. Unlocking here changes this preview.</span>
                </div>
                <Button
                  className="card-action w-full py-3"
                  onClick={() => {
                    setUnlocked([...unlocked, selectedCategory]);
                    closeModal();
                  }}
                >
                  <span>Unlock in Demo</span> <ArrowRight />
                </Button>
              </div>
            )}

            {/* --- PRIVACY POLICY MODAL --- */}
            {modal === 'privacy' && (
              <div className="modal-body max-h-[75vh] overflow-y-auto">
                <div className="modal-icon text-emerald-600 bg-emerald-50">
                  <ShieldCheck />
                </div>
                <div className="modal-kicker text-emerald-700">DATA PRIVACY & PROTECTION</div>
                <h2>Privacy Policy</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Last updated: January 2026 · Compliant with the Kenya Data Protection Act (KDPA) 2019.
                </p>

                <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">1. Information We Collect</h4>
                    <p>
                      When you register and use Survey Pay Kenya, we collect:
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-600">
                      <li>Contact details: Your registered email address and M-Pesa mobile phone number.</li>
                      <li>Demographic data: Age range, gender, county of residence, and general consumer preferences.</li>
                      <li>Survey responses: Opinions, feedback, and questionnaire selections submitted during active studies.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">2. Purpose & Use of Data</h4>
                    <p>
                      Personal data is processed strictly for:
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-600">
                      <li>Matching panelists with relevant consumer research studies and demographic requirements.</li>
                      <li>Verifying survey completion authenticity and processing reward redemptions via M-Pesa.</li>
                      <li>Generating anonymized, aggregated research statistics for consumer insights. We never sell your personal contact info for unsolicited third-party marketing.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">3. Data Security & Storage</h4>
                    <p>
                      All transmission of data between your browser and our servers is secured via 256-bit SSL encryption. We employ industry-standard access controls to safeguard panelist records against unauthorized access.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">4. Your Rights</h4>
                    <p>
                      Under the Kenya Data Protection Act, you possess the right to access, rectify, or request erasure of your personal data. You may withdraw consent or close your panel account at any time by contacting <strong>privacy@surveypay.co.ke</strong>.
                    </p>
                  </div>
                </div>

                <Button className="card-action w-full py-2.5 mt-5 font-bold" onClick={closeModal}>
                  I Understand & Agree
                </Button>
              </div>
            )}

            {/* --- TERMS OF SERVICE MODAL --- */}
            {modal === 'terms' && (
              <div className="modal-body max-h-[75vh] overflow-y-auto">
                <div className="modal-icon text-blue-600 bg-blue-50">
                  <FileText />
                </div>
                <div className="modal-kicker text-blue-700">USER AGREEMENT</div>
                <h2>Terms of Service</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Please review the rules governing voluntary participation on Survey Pay Kenya.
                </p>

                <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">1. Eligibility</h4>
                    <p>
                      Membership is open solely to natural individuals residing in Kenya who are at least 18 years of age and hold an active, registered Safaricom M-Pesa line in their own name.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">2. Honest & Authentic Participation</h4>
                    <p>
                      Panelists agree to provide genuine, thoughtful responses to all survey questions. The use of automated scripts, bots, rapid random clicking, duplicate accounts, or fraudulent demographic data is strictly prohibited and results in immediate forfeiture of rewards and account termination.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">3. Rewards & Redemptions</h4>
                    <p>
                      Reward credits are granted upon satisfactory completion of eligible surveys as validated by quality control checks. Redemptions are issued via M-Pesa in Kenya Shillings (KSh). Minimum withdrawal limits and tier thresholds apply as outlined in the member dashboard.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">4. Intellectual Property & Brand References</h4>
                    <p>
                      All survey questions, methodologies, and content are protected. Company logos and brand names displayed on the portal are the property of their respective trademark holders and serve solely to indicate research categories.
                    </p>
                  </div>
                </div>

                <Button className="card-action w-full py-2.5 mt-5 font-bold" onClick={closeModal}>
                  Close & Return
                </Button>
              </div>
            )}

            {/* --- PARTICIPATION GUIDELINES MODAL --- */}
            {modal === 'disclaimer' && (
              <div className="modal-body max-h-[75vh] overflow-y-auto">
                <div className="modal-icon text-emerald-600 bg-emerald-50">
                  <ShieldCheck />
                </div>
                <div className="modal-kicker text-emerald-700">COMMUNITY STANDARDS</div>
                <h2>Research Participation Guidelines</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Transparency regarding survey methodology, eligibility, and community feedback standards.
                </p>

                <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <p className="font-semibold text-emerald-900">
                      Survey Pay Kenya is an independent consumer research community. Participation in all studies is 100% voluntary.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">1. Study Availability & Criteria</h4>
                    <p>
                      Research topics depend upon current consumer sentiment studies, partner research agendas, and target demographic criteria. Questionnaire availability varies dynamically based on project quotas.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">2. Quality & Thoughtful Responses</h4>
                    <p>
                      Research partners rely on accurate, genuine feedback. Responses must reflect personal consumer experiences and pass consistency and quality checks.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">3. Privacy & Independent Research</h4>
                    <p>
                      Responses are aggregated and anonymized for market trend analysis. We do not sell personally identifiable contact data or distribute unsolicited third-party solicitations.
                    </p>
                  </div>
                </div>

                <Button className="card-action w-full py-2.5 mt-5 font-bold" onClick={closeModal}>
                  Understood
                </Button>
              </div>
            )}

            {/* --- CONTACT SUPPORT MODAL --- */}
            {modal === 'contact' && (
              <div className="modal-body">
                <div className="modal-icon text-emerald-600 bg-emerald-50">
                  <HelpCircle />
                </div>
                <div className="modal-kicker text-emerald-700">WE'RE HERE TO HELP</div>
                <h2>Contact & Support</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Need assistance with your account, survey access, or research questions?
                </p>

                <div className="space-y-3 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <strong className="block text-gray-900 font-bold mb-0.5">Email Support</strong>
                    <span className="text-emerald-700 font-mono text-sm font-semibold">support@surveypay.co.ke</span>
                    <p className="text-gray-500 text-[11px] mt-1">Average response time: 2 – 4 hours during business days.</p>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <strong className="block text-gray-900 font-bold mb-0.5">Operating Hours (East Africa Time)</strong>
                    <p className="text-gray-600 text-[11px]">
                      Monday – Friday: 8:00 AM – 6:00 PM EAT<br />
                      Saturday: 9:00 AM – 2:00 PM EAT<br />
                      Sunday & Public Holidays: Closed
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <strong className="block text-gray-900 font-bold mb-0.5">Head Office</strong>
                    <p className="text-gray-600 text-[11px]">
                      Survey Pay Research & Media Labs<br />
                      Westlands Commercial Hub, Nairobi, Kenya
                    </p>
                  </div>
                </div>

                <Button className="card-action w-full py-2.5 mt-4 font-bold" onClick={closeModal}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategic Live Social Proof Toast (only on dashboard for active members, never on public landing) */}
      {showToast && modal !== 'survey' && !toastDismissed && view !== 'landing' && (
        <aside className="live-proof-toast" role="status" aria-live="polite">
          <div
            className="live-proof-avatar"
            style={{ backgroundColor: liveProofFeed[toastIndex]?.color || '#059669' }}
          >
            {liveProofFeed[toastIndex]?.initials || 'SP'}
          </div>
          <div className="live-proof-content">
            <div className="live-proof-top">
              <span className="live-proof-name">{liveProofFeed[toastIndex]?.name}</span>
              <span className="live-proof-location">({liveProofFeed[toastIndex]?.town})</span>
              <span className="live-proof-pill">
                <Check className="w-2.5 h-2.5" /> M-Pesa Verified
              </span>
            </div>
            <div className="live-proof-action">
              {liveProofFeed[toastIndex]?.action}{' '}
              <strong>{liveProofFeed[toastIndex]?.amount}</strong>
            </div>
            <div className="live-proof-time">{liveProofFeed[toastIndex]?.time}</div>
          </div>
          <button
            type="button"
            className="live-proof-close"
            onClick={() => setToastDismissed(true)}
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" className={active ? 'sidebar-link active' : 'sidebar-link'} onClick={onClick}>
      <Icon />
      <span>{label}</span>
      {active && <span className="sidebar-indicator" />}
    </Button>
  );
}

// SURVEY CARD ITEM WITH POTENTIAL EARNINGS TRIGGERS & VIBRANT TAKE SURVEY BUTTON
function SurveyCardItem({
  survey,
  completed,
  plan,
  unlockedSurveyIds = [],
  freeSurveyEarnings = 0,
  onClick,
}: {
  survey: Survey;
  completed: boolean;
  plan: string | null;
  unlockedSurveyIds?: number[];
  freeSurveyEarnings?: number;
  onClick: () => void;
}) {
  const isLocked =
    !unlockedSurveyIds.includes(survey.id) &&
    (survey.locked || freeSurveyEarnings >= 2000) &&
    (!plan || plan === 'Free');

  return (
    <article className="survey-card">
      <div className="survey-image">
        <img
          src={survey.image}
          alt={survey.company}
          loading="lazy"
          className="main-card-img"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = brandLogos.safaricom;
          }}
        />
        <span className="survey-category">{survey.category}</span>

        {/* POTENTIAL EARNINGS TRIGGER PILL ON CARDS */}
        {isLocked ? (
          <span className="card-trigger-pill">
            <LockKeyhole className="w-3 h-3 text-amber-400" />
            <span>Potential: <strong>+KSh {survey.potential.toLocaleString()}</strong></span>
          </span>
        ) : (
          <span className="card-trigger-pill free">
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
            <span>Potential: <strong>KSh 150 Instant</strong></span>
          </span>
        )}
      </div>

      <div className="survey-card-body">
        <div className="company-row">
          {survey.logo ? (
            <img src={survey.logo} alt={survey.company} className="brand-logo-img p-0.5 border" />
          ) : (
            <span className={`company-logo ${survey.tone}`}>{survey.initials}</span>
          )}
          <div>
            <strong>{survey.company}</strong>
            <small>Verified Kenyan brand study</small>
          </div>
          <span className="card-arrow">
            <ArrowUpRight />
          </span>
        </div>

        <h3>{survey.topic}</h3>

        {/* POTENTIAL EARNINGS CALLOUT BOX */}
        <div className={`card-potential-box ${isLocked ? 'locked-box' : ''}`}>
          <span className="potential-label">
            <TrendingUp className="w-3.5 h-3.5" /> Est. Daily Potential:
          </span>
          <span className="potential-val">
            {isLocked ? survey.potentialDaily : 'KSh 2,000/day'}
          </span>
        </div>

        <div className="survey-card-footer">
          <span>
            <Clock3 /> {survey.time} · 5 Questions
          </span>
          <strong>{completed ? 'Completed' : `+ KSh ${survey.potential.toLocaleString()}`}</strong>
        </div>

        {/* VIBRANT TAKE SURVEY BUTTON WITH COLOR */}
        <Button
          className={`card-action ${completed ? 'card-action-completed' : isLocked ? 'card-action-locked' : 'card-action-take'}`}
          onClick={onClick}
          disabled={completed}
        >
          <span>
            {completed ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-700" /> Completed (+KSh {survey.potential.toLocaleString()})
              </span>
            ) : isLocked ? (
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="w-4 h-4 text-amber-400" /> Unlock Survey (+KSh {survey.potential.toLocaleString()})
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-200" /> Take Survey (+KSh {(survey.potential || 150).toLocaleString()})
              </span>
            )}
          </span>
          {completed ? <Check className="w-4 h-4" /> : isLocked ? <LockKeyhole className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </article>
  );
}

function CategoryGrid({
  activated,
  unlocked,
  onChoose,
}: {
  activated: boolean;
  unlocked: number[];
  onChoose: (i: number) => void;
}) {
  return (
    <div className="category-grid">
      {categories.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={c.name} className={`category-card category-${c.tone}`}>
            <div className="category-top">
              <span className="category-icon">
                <Icon />
              </span>
              <span className="category-status">
                {i === 0 ? 'OPEN' : unlocked.includes(i) ? 'DEMO OPEN' : 'LOCKED'}
              </span>
            </div>
            <div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <div className="category-potential">
                Up to <strong>KSh {c.potential.toLocaleString()}</strong> <small>potential</small>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                i === 0
                  ? document.querySelector('.app-survey-grid')?.scrollIntoView({ behavior: 'smooth' })
                  : onChoose(i)
              }
            >
              {i === 0
                ? activated
                  ? 'Explore surveys'
                  : 'Explore collection'
                : unlocked.includes(i)
                ? 'View preview'
                : `Preview KSh ${c.price}`}{' '}
              {i === 0 || unlocked.includes(i) ? <ArrowRight /> : <LockKeyhole />}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
