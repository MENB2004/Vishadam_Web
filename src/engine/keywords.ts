// VISHADAM — NLP Engine: Keyword Extraction & Bucket Mapping

import type { Language } from './detectLanguage';

export type Bucket = 
  | 'failed-exam' 
  | 'breakup' 
  | 'work-stress' 
  | 'nothing-works' 
  | 'loneliness'
  | 'family-pressure'
  | 'money'
  | 'general';

// --- Stopwords ---

const STOPWORDS_EN = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'really', 'like', 'feel', 'feeling', 'felt', 'got', 'get',
  'going', 'went', 'know', 'think', 'even', 'still', 'keep', 'much', 'today',
  'yesterday', 'day', 'time', 'thing', 'things', 'way', 'life', 'bad', 'good',
  'want', 'make', 'made', 'ever', 'never', 'could', 'would', 'something',
]);

const STOPWORDS_ML = new Set([
  'എനിക്ക്', 'എന്റെ', 'ഒരു', 'ആണ്', 'ഉണ്ട്', 'പറ്റി', 'അല്ലേ', 'ഇല്ല',
  'ആ', 'ഈ', 'അത്', 'ഇത്', 'എന്ന്', 'ഞാൻ', 'നീ', 'അവൻ', 'അവൾ', 'ഞങ്ങൾ',
  'നിങ്ങൾ', 'അവർ', 'ചെയ്യുന്നു', 'ചെയ്തു', 'ആയി', 'ആയിരുന്നു', 'ഉണ്ടായിരുന്നു',
  'കൂടെ', 'മുതൽ', 'വരെ', 'ശേഷം', 'മുമ്പ്', 'ഇവിടെ', 'അവിടെ', 'എവിടെ',
  'എങ്ങനെ', 'എന്തുകൊണ്ട്', 'എപ്പോൾ', 'ഒന്ന്', 'രണ്ട്', 'മൂന്ന്',
  'വളരെ', 'വേണ്ട', 'ചെയ്യാൻ', 'പോയി', 'വരുന്നു', 'കൊണ്ട്',
]);

// --- Bucket Keyword Maps ---

interface BucketKeywords {
  en: string[];
  ml: string[];
}

const BUCKET_MAP: Record<Exclude<Bucket, 'general'>, BucketKeywords> = {
  'failed-exam': {
    en: [
      'exam', 'exams', 'fail', 'failed', 'marks', 'result', 'results', 'test',
      'grade', 'grades', 'study', 'studying', 'syllabus', 'semester', 'cgpa',
      'gpa', 'paper', 'backlog', 'backlogs', 'score', 'scored', 'class',
      'tuition', 'teacher', 'professor', 'homework', 'assignment', 'project',
      'college', 'university', 'school', 'degree', 'flunk', 'flunked',
      'supplementary', 'retest', 'academic',
    ],
    ml: [
      'പരീക്ഷ', 'ഫെയിൽ', 'മാർക്ക്', 'റിസൾട്ട്', 'പഠനം', 'സിലബസ്',
      'സെമസ്റ്റർ', 'ക്ലാസ്', 'ടീച്ചർ', 'കോളേജ്', 'സ്കൂൾ',
      'അസൈൻമെന്റ്', 'ബാക്ക്ലോഗ്', 'ഗ്രേഡ്', 'സ്കോർ',
    ],
  },
  'breakup': {
    en: [
      'breakup', 'break-up', 'broke up', 'ex', 'love', 'heart', 'heartbreak',
      'heartbroken', 'relationship', 'girlfriend', 'boyfriend', 'gf', 'bf',
      'crush', 'rejected', 'rejection', 'ghosted', 'ghost', 'dumped', 'left',
      'cheated', 'cheating', 'loyal', 'loyal', 'partner', 'dating', 'date',
      'single', 'alone', 'miss', 'missing', 'moved on', 'over me', 'toxic',
      'situationship', 'married', 'propose', 'wedding',
    ],
    ml: [
      'ബ്രേക്കപ്പ്', 'പ്രണയം', 'മനസ്സ്', 'ഹൃദയം', 'കാമുകി', 'കാമുകൻ',
      'ഇഷ്ടം', 'സ്നേഹം', 'വിട്ടു', 'ഉപേക്ഷിച്ചു', 'ഒറ്റയ്ക്ക്',
      'റിലേഷൻഷിപ്പ്', 'പ്രേമം', 'വേദന', 'നഷ്ടം',
    ],
  },
  'work-stress': {
    en: [
      'work', 'boss', 'job', 'office', 'deadline', 'stress', 'stressed',
      'fired', 'layoff', 'laid off', 'salary', 'pay', 'promotion', 'client',
      'meeting', 'manager', 'coworker', 'colleague', 'toxic', 'overwork',
      'overtime', 'burnout', 'burnt out', 'career', 'resign', 'quit',
      'interview', 'rejection', 'hired', 'company', 'corporate', 'startup',
      'appraisal', 'performance', 'review', 'workload', 'remote',
    ],
    ml: [
      'ജോലി', 'ബോസ്', 'ഓഫീസ്', 'സ്ട്രെസ്', 'ഡെഡ്ലൈൻ', 'ശമ്പളം',
      'മാനേജർ', 'കമ്പനി', 'കരിയർ', 'ജോലിഭാരം', 'പ്രമോഷൻ',
      'ലേഓഫ്', 'ഇന്റർവ്യൂ',
    ],
  },
  'nothing-works': {
    en: [
      'nothing', 'useless', 'always', 'hopeless', 'pointless', 'waste',
      'stuck', 'lost', 'confused', 'tired', 'exhausted', 'frustrated',
      'frustrated', 'depressed', 'depression', 'anxiety', 'anxious', 'sad',
      'sadness', 'miserable', 'unhappy', 'unlucky', 'cursed', 'doomed',
      'pathetic', 'worthless', 'failure', 'loser', 'give up', 'cant',
      'impossible', 'unfair', 'worst', 'terrible', 'horrible', 'hate',
      'sucks', 'disaster', 'ruined', 'wrong', 'broke',
    ],
    ml: [
      'ഒന്നും', 'പറ്റില്ല', 'എപ്പോഴും', 'നിരാശ', 'വിഷാദം', 'ക്ഷീണം',
      'സങ്കടം', 'ദുഃഖം', 'വിധി', 'പരാജയം', 'കഷ്ടം', 'മോശം',
    ],
  },
  'loneliness': {
    en: [
      'alone', 'lonely', 'nobody', 'no one', 'isolated', 'invisible',
      'ignored', 'forgotten', 'friendless', 'friends', 'social', 'antisocial',
      'outcast', 'introvert', 'left out', 'excluded',
    ],
    ml: [
      'ഏകാന്തത', 'ആരും', 'തനിച്ച്', 'ഒറ്റയ്ക്ക്', 'സുഹൃത്തുക്കൾ',
    ],
  },
  'family-pressure': {
    en: [
      'parents', 'marriage', 'family', 'mom', 'dad', 'mother', 'father',
      'arranged', 'expectation', 'expectations', 'pressure', 'sibling',
      'brother', 'sister', 'comparison', 'compare', 'relative', 'relatives',
      'uncle', 'aunt', 'cousin', 'in-laws',
    ],
    ml: [
      'അമ്മ', 'അച്ഛൻ', 'വീട്ടിൽ', 'കല്യാണം', 'കുടുംബം', 'മാതാപിതാക്കൾ',
      'സമ്മർദ്ദം', 'ബന്ധുക്കൾ', 'ചേട്ടൻ', 'ചേച്ചി',
    ],
  },
  'money': {
    en: [
      'money', 'debt', 'broke', 'fee', 'fees', 'loan', 'emi', 'rent',
      'expensive', 'afford', 'poor', 'salary', 'income', 'savings',
      'financial', 'bankrupt', 'invest', 'investment', 'loss', 'credit',
      'bill', 'bills', 'tax', 'taxes',
    ],
    ml: [
      'പണം', 'കടം', 'ഫീസ്', 'വാടക', 'ശമ്പളം', 'സാമ്പത്തികം',
      'ലോൺ', 'ഇഎംഐ',
    ],
  },
};

// --- Tokenizer ---

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase().normalize('NFC');
  // Split on whitespace and common punctuation, keep Malayalam characters
  return normalized
    .split(/[\s,.!?;:'"(){}<>/\\|@#$%^&*~`+=\-_]+/)
    .filter(token => token.length > 1);
}

// --- Keyword Extraction ---

export function extractKeywords(text: string, lang: Language): string[] {
  const tokens = tokenize(text);
  const stopwords = lang === 'ml' ? STOPWORDS_ML : STOPWORDS_EN;

  return tokens.filter(token => !stopwords.has(token));
}

// --- Bucket Mapping ---

export interface BucketResult {
  bucket: Bucket;
  keyword: string | null;
  score: number;
}

export function mapToBucket(keywords: string[], lang: Language): BucketResult {
  const scores: Record<string, { score: number; matchedKeyword: string | null }> = {};

  for (const [bucket, bucketKws] of Object.entries(BUCKET_MAP)) {
    const kwList = lang === 'ml' ? [...bucketKws.ml, ...bucketKws.en] : [...bucketKws.en, ...bucketKws.ml];
    let bestMatch: string | null = null;
    let score = 0;

    for (const keyword of keywords) {
      for (const bucketKw of kwList) {
        if (keyword === bucketKw || keyword.includes(bucketKw) || bucketKw.includes(keyword)) {
          score++;
          if (!bestMatch) bestMatch = keyword;
        }
      }
    }

    scores[bucket] = { score, matchedKeyword: bestMatch };
  }

  // Find the bucket with highest score
  let bestBucket: Bucket = 'general';
  let bestScore = 0;
  let bestKeyword: string | null = null;

  for (const [bucket, { score, matchedKeyword }] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestBucket = bucket as Bucket;
      bestKeyword = matchedKeyword;
    }
  }

  return {
    bucket: bestBucket,
    keyword: bestKeyword,
    score: bestScore,
  };
}
