/* ============================================================
   data.js — Built-in IELTS vocabulary & phrases (from yasi/ images)
   All data is static; no network required for core features.
   ============================================================ */

/* ---- Built-in IELTS word bank ----
   Each entry: { en, cn, phon?, examples?, etymology?, synonyms?, antonyms? }
   `examples` / `etymology` are pre-written for high-frequency words
   (others fall back to online API + student fill-in via Encyclopedia). */
const IELTS_WORDS = [
  // ===== RED (high-error) words — these also seed the error bank =====
  { en: "poisonous", cn: "有毒的", phon: "/ˈpɔɪzənəs/",
    examples: [
      "Some mushrooms are poisonous and can be fatal.",
      "The snake's poisonous bite required immediate treatment.",
      "Be careful—many bright berries in the wild are poisonous.",
      "Poisonous chemicals leaked into the river.",
      "She mistook the poisonous plant for an edible herb."
    ],
    etymology: "From 'poison' (Latin potio, 'drink') + -ous.",
    synonyms: ["toxic", "venomous"], antonyms: ["safe", "harmless"] },

  { en: "academic", cn: "学术的", phon: "/ˌækəˈdemɪk/",
    examples: [
      "She has a strong academic background in physics.",
      "The journal publishes only peer-reviewed academic research.",
      "Academic performance often correlates with study habits.",
      "He presented his findings at an academic conference.",
      "The debate remained purely academic, with no practical outcome."
    ],
    etymology: "From Greek Akadēmos (Plato's school 'Akademeia').",
    synonyms: ["scholarly", "educational"], antonyms: ["practical", "vocational"] },

  { en: "theoretical", cn: "理论的", phon: "/ˌθɪəˈretɪkl/",
    examples: [
      "The plan works in theory, but it is purely theoretical.",
      "Her research focuses on theoretical physics.",
      "There is a theoretical risk, but it rarely happens in practice.",
      "The course covers both theoretical and applied linguistics.",
      "Theoretical models must be tested by experiments."
    ],
    etymology: "From Greek theōria, 'contemplation, speculation'.",
    synonyms: ["hypothetical", "abstract"], antonyms: ["practical", "empirical"] },

  { en: "annually", cn: "每年地", phon: "/ˈænjuəli/",
    examples: [
      "The festival is held annually in March.",
      "The company reviews its strategy annually.",
      "Millions of birds migrate annually across the continent.",
      "We pay our insurance premium annually.",
      "The report is published annually."
    ],
    etymology: "From Latin annus, 'year'.",
    synonyms: ["yearly", "per annum"], antonyms: [] },

  { en: "Russia", cn: "俄罗斯", phon: "/ˈrʌʃə/",
    examples: [
      "Russia is the largest country in the world by area.",
      "She travelled across Russia by train.",
      "Russia exports large amounts of natural gas.",
      "Winters in northern Russia are extremely cold.",
      "He studies the history of Russia in the 19th century."
    ],
    etymology: "From Rus', the medieval state of the East Slavs.",
    synonyms: [], antonyms: [] },

  // ===== General IELTS bank (from images 1,6,7,8,12,20) =====
  { en: "acquire", cn: "获得", phon: "/əˈkwaɪə(r)/",
    examples: [
      "She managed to acquire a rare painting.",
      "Children acquire language naturally.",
      "He acquired the company in 2010.",
      "It takes years to acquire professional skills.",
      "The museum acquired a new collection."
    ],
    etymology: "From Latin acquirere, ad- + quaerere 'to seek'.",
    synonyms: ["obtain", "gain"], antonyms: ["lose", "forfeit"] },

  { en: "adaptation", cn: "适应；改编", phon: "/ˌædæpˈteɪʃn/",
    examples: [
      "The film is an adaptation of a famous novel.",
      "Desert animals show remarkable adaptation to heat.",
      "Adaptation to cold climates takes generations.",
      "The stage adaptation was a huge success.",
      "Evolution relies on genetic adaptation."
    ],
    etymology: "From Latin adaptare, ad- + aptare 'to fit'.",
    synonyms: ["modification", "adjustment"], antonyms: [] },

  { en: "agriculture", cn: "农业", phon: "/ˈæɡrɪkʌltʃə(r)/",
    examples: [
      "Agriculture remains the backbone of the economy.",
      "Modern agriculture relies heavily on technology.",
      "She studied agriculture at university.",
      "Climate change threatens traditional agriculture.",
      "Sustainable agriculture protects the soil."
    ],
    etymology: "From Latin ager 'field' + cultura 'cultivation'.",
    synonyms: ["farming"], antonyms: [] },

  { en: "bachelor", cn: "学士；单身汉", phon: "/ˈbætʃələ(r)/",
    examples: [
      "He earned a bachelor's degree in chemistry.",
      "She is a bachelor of science student.",
      "He remained a bachelor all his life.",
      "The bachelor apartment was small but cosy.",
      "A bachelor party was held before the wedding."
    ],
    etymology: "From Latin baccalarius, 'low-ranking servant/student'.",
    synonyms: ["unmarried man"], antonyms: [] },

  { en: "balcony", cn: "阳台", phon: "/ˈbælkəni/",
    examples: [
      "We had breakfast on the balcony.",
      "Her room overlooks the balcony of the hotel.",
      "Plants thrive on a sunny balcony.",
      "He stepped onto the balcony for fresh air.",
      "The balcony seats offered a great view."
    ],
    etymology: "From Italian balcone, of Germanic origin.",
    synonyms: ["terrace"], antonyms: [] },

  { en: "boundary", cn: "边界", phon: "/ˈbaʊndri/",
    examples: [
      "The river forms the boundary between the two countries.",
      "Don't cross the boundary of the property.",
      "Scientists pushed the boundary of knowledge.",
      "The fence marks the boundary of the garden.",
      "Respect the boundary between work and life."
    ],
    etymology: "From bound (limit) + -ary.",
    synonyms: ["border", "limit"], antonyms: [] },

  { en: "catalogue", cn: "目录", phon: "/ˈkætəlɒɡ/",
    examples: [
      "You can browse the online catalogue.",
      "The library catalogue lists every book.",
      "She ordered a product from the catalogue.",
      "The museum published a catalogue of its exhibits.",
      "Stars are recorded in a celestial catalogue."
    ],
    etymology: "From Greek katalogos, kata- + legein 'to gather/say'.",
    synonyms: ["directory", "index"], antonyms: [] },

  { en: "climate", cn: "气候", phon: "/ˈklaɪmət/",
    examples: [
      "The climate here is mild and wet.",
      "Global climate is changing rapidly.",
      "She moved south for a warmer climate.",
      "Tropical climate supports diverse wildlife.",
      "Climate affects agricultural yields."
    ],
    etymology: "From Greek klima, 'slope/zone of the earth'.",
    synonyms: ["weather (pattern)"], antonyms: [] },

  { en: "conservative", cn: "保守的", phon: "/kənˈsɜːvətɪv/",
    examples: [
      "He holds conservative political views.",
      "The estimate is conservative; costs may rise.",
      "She dressed in a conservative style.",
      "Conservative investors avoid high risk.",
      "The party promotes conservative values."
    ],
    etymology: "From Latin conservare, 'to keep, preserve'.",
    synonyms: ["traditional", "cautious"], antonyms: ["liberal", "radical"] },

  { en: "dilemma", cn: "困境；两难", phon: "/dɪˈlemə/",
    examples: [
      "She faced a dilemma between career and family.",
      "The manager is in a dilemma over the budget.",
      "Choosing a university was a real dilemma.",
      "It's a moral dilemma with no easy answer.",
      "The dilemma left him sleepless."
    ],
    etymology: "From Greek di- 'two' + lemma 'proposition'.",
    synonyms: ["predicament", "quandary"], antonyms: [] },

  { en: "embassy", cn: "大使馆", phon: "/ˈembəsi/",
    examples: [
      "She works at the British Embassy.",
      "Protesters gathered outside the embassy.",
      "He went to the embassy to renew his passport.",
      "The embassy issued a travel warning.",
      "Diplomats met at the embassy."
    ],
    etymology: "From Latin ambactus, via Old French; related to 'ambassador'.",
    synonyms: ["mission", "consulate"], antonyms: [] },

  { en: "furniture", cn: "家具", phon: "/ˈfɜːnɪtʃə(r)/",
    examples: [
      "We bought new furniture for the living room.",
      "The room had no furniture at all.",
      "Antique furniture can be very valuable.",
      "She arranged the furniture carefully.",
      "Flat-pack furniture is easy to transport."
    ],
    etymology: "From Latin mobilis via French fournir 'to furnish'.",
    synonyms: ["furnishings"], antonyms: [] },

  { en: "institute", cn: "学院；机构", phon: "/ˈɪnstɪtjuːt/",
    examples: [
      "She works at a research institute.",
      "The institute offers language courses.",
      "He founded the institute in 1995.",
      "The policy was instituted last year.",
      "The institute published a landmark study."
    ],
    etymology: "From Latin institutus, past participle of instituere 'to set up'.",
    synonyms: ["establishment", "organization"], antonyms: [] },

  { en: "majority", cn: "多数", phon: "/məˈdʒɒrəti/",
    examples: [
      "The majority of students passed the exam.",
      "She won by a clear majority.",
      "A large majority supports the reform.",
      "The majority rule applies in voting.",
      "In the majority of cases, rest helps."
    ],
    etymology: "From Latin major, 'greater'.",
    synonyms: ["most", "bulk"], antonyms: ["minority"] },

  { en: "offence", cn: "犯罪；冒犯", phon: "/əˈfens/",
    examples: [
      "He was charged with a serious offence.",
      "No offence was intended by the remark.",
      "Driving drunk is a criminal offence.",
      "She took offence at his joke.",
      "The offence carries a heavy fine."
    ],
    etymology: "From Latin offensa, 'stumbling block / displeasure'.",
    synonyms: ["crime", "violation"], antonyms: [] },

  { en: "pension", cn: "养老金", phon: "/ˈpenʃn/",
    examples: [
      "He retired and now lives on a pension.",
      "The company offers a good pension scheme.",
      "She draws a state pension.",
      "Pension funds invest in the stock market.",
      "Many workers worry about their pension."
    ],
    etymology: "From Latin pensionem, 'payment', from pendere 'to pay/weigh'.",
    synonyms: ["retirement income"], antonyms: [] },

  { en: "possibility", cn: "可能性", phon: "/ˌpɒsəˈbɪləti/",
    examples: [
      "There is a possibility of rain tomorrow.",
      "We must consider every possibility.",
      "The possibility excited everyone.",
      "What are the possibilities for expansion?",
      "A new possibility has emerged."
    ],
    etymology: "From Latin possibilis, posse 'to be able'.",
    synonyms: ["chance", "potential"], antonyms: ["impossibility"] },

  { en: "receive", cn: "收到", phon: "/rɪˈsiːv/",
    examples: [
      "I received your letter yesterday.",
      "She received an award for her work.",
      "Did you receive the email I sent?",
      "He received a warm welcome.",
      "The hotel receives many guests daily."
    ],
    etymology: "From Latin recipere, re- + capere 'to take' (cf. 'recipe').",
    synonyms: ["get", "accept"], antonyms: ["send", "give"] },

  { en: "refrigerator", cn: "冰箱", phon: "/rɪˈfrɪdʒəreɪtə(r)/",
    examples: [
      "Put the milk in the refrigerator.",
      "The refrigerator keeps food fresh.",
      "She bought a new refrigerator.",
      "The refrigerator is making a strange noise.",
      "Modern refrigerators are energy-efficient."
    ],
    etymology: "From Latin refrigerare, re- + frigus 'cold'.",
    synonyms: ["fridge"], antonyms: [] },

  { en: "sceptical", cn: "怀疑的", phon: "/ˈskeptɪkl/",
    examples: [
      "I'm sceptical about his claims.",
      "Scientists remain sceptical of the theory.",
      "She gave a sceptical look.",
      "Many are sceptical of the new policy.",
      "A sceptical audience asked tough questions."
    ],
    etymology: "From Greek skeptikos, 'thoughtful, inquiring'.",
    synonyms: ["doubtful", "suspicious"], antonyms: ["trusting", "convinced"] },

  { en: "symptom", cn: "症状", phon: "/ˈsɪmptəm/",
    examples: [
      "Fever is a common symptom of flu.",
      "The symptoms appeared overnight.",
      "Early symptoms are easy to miss.",
      "A rash can be a symptom of allergy.",
      "Recognise the symptoms and seek help."
    ],
    etymology: "From Greek symptōma, 'chance, falling together'.",
    synonyms: ["sign", "indication"], antonyms: [] },

  { en: "throughout", cn: "贯穿；遍及", phon: "/θruːˈaʊt/",
    examples: [
      "It rained throughout the night.",
      "The news spread throughout the country.",
      "He remained calm throughout the crisis.",
      "Sugar is found throughout the diet.",
      "Throughout history, people have migrated."
    ],
    etymology: "through + out, 'in every part of'.",
    synonyms: ["all through", "across"], antonyms: [] },

  { en: "anecdote", cn: "轶事", phon: "/ˈænɪkdəʊt/",
    examples: [
      "He told a funny anecdote about his trip.",
      "The book is full of amusing anecdotes.",
      "She shared an anecdote from her childhood.",
      "An anecdote can enliven a speech.",
      "The anecdote illustrated his point well."
    ],
    synonyms: ["story", "tale"], antonyms: [] },

  { en: "associate", cn: "联系；伙伴", phon: "/əˈsəʊʃieɪt/",
    examples: [
      "People associate red with danger.",
      "I associate this song with summer.",
      "She is an associate professor.",
      "He is a business associate of mine.",
      "Don't associate with bad company."
    ],
    synonyms: ["connect", "link"], antonyms: ["dissociate"] },

  { en: "audience", cn: "观众", phon: "/ˈɔːdiəns/",
    examples: [
      "The audience cheered loudly.",
      "The show attracts a large audience.",
      "She addressed the audience directly.",
      "The audience laughed at the joke.",
      "TV audiences are shrinking."
    ],
    synonyms: ["spectators", "viewers"], antonyms: [] },

  { en: "cruel", cn: "残酷的", phon: "/ˈkruːəl/",
    examples: [
      "It is cruel to tease animals.",
      "He suffered a cruel fate.",
      "Cruel words can wound deeply.",
      "The punishment was unnecessarily cruel.",
      "She gave him a cruel smile."
    ],
    synonyms: ["harsh", "unkind"], antonyms: ["kind", "gentle"] },

  { en: "deaf", cn: "聋的", phon: "/def/",
    examples: [
      "The old man is deaf in one ear.",
      "She was born deaf.",
      "Deaf people use sign language.",
      "He turned a deaf ear to their pleas.",
      "The explosion left him partially deaf."
    ],
    synonyms: ["hearing-impaired"], antonyms: [] },

  { en: "deliberately", cn: "故意地", phon: "/dɪˈlɪbərətli/",
    examples: [
      "He deliberately ignored her.",
      "She deliberately arrived late.",
      "The fire was started deliberately.",
      "He spoke slowly and deliberately.",
      "They deliberately misled the public."
    ],
    synonyms: ["intentionally", "on purpose"], antonyms: ["accidentally"] },

  { en: "fortress", cn: "堡垒", phon: "/ˈfɔːtrəs/",
    examples: [
      "The old fortress overlooks the bay.",
      "Troops defended the fortress bravely.",
      "The fortress was built in the 12th century.",
      "A mountain fortress protected the kingdom.",
      "The city became an industrial fortress."
    ],
    synonyms: ["stronghold", "castle"], antonyms: [] },

  { en: "institution", cn: "机构；制度", phon: "/ˌɪnstɪˈtjuːʃn/",
    examples: [
      "The hospital is a respected institution.",
      "Marriage is a social institution.",
      "He spent time in a mental institution.",
      "Financial institutions regulate the market.",
      "The institution was founded in 1850."
    ],
    synonyms: ["establishment", "organization"], antonyms: [] },

  { en: "pattern", cn: "模式；图案", phon: "/ˈpætn/",
    examples: [
      "The fabric has a floral pattern.",
      "Detectives noticed a pattern in the crimes.",
      "Weather follows a seasonal pattern.",
      "She set a new sleep pattern.",
      "The pattern repeats every few inches."
    ],
    synonyms: ["design", "model"], antonyms: [] },

  { en: "secure", cn: "安全的；获得", phon: "/sɪˈkjʊə(r)/",
    examples: [
      "Make sure the door is secure.",
      "She feels secure in her job.",
      "He secured a place at university.",
      "The rope secured the boat to the dock.",
      "A secure password protects your account."
    ],
    synonyms: ["safe", "obtain"], antonyms: ["unsafe", "vulnerable"] },

  { en: "spy", cn: "间谍", phon: "/spaɪ/",
    examples: [
      "He was accused of being a spy.",
      "The spy gathered secret information.",
      "She likes to spy on her neighbours.",
      "Industrial spies steal company secrets.",
      "A spy novel kept me up all night."
    ],
    synonyms: ["agent", "informant"], antonyms: [] },

  { en: "salute", cn: "敬礼", phon: "/səˈluːt/",
    examples: [
      "The soldiers salute their officer.",
      "He raised his hand in a salute.",
      "They saluted the flag.",
      "She saluted his courage.",
      "A 21-gun salute honoured the leader."
    ],
    synonyms: ["greet", "honour"], antonyms: [] },

  { en: "complex", cn: "复杂的", phon: "/ˈkɒmpleks/",
    examples: [
      "This is a complex problem.",
      "The plot of the novel is complex.",
      "She explained the complex theory clearly.",
      "A complex of buildings stood on the hill.",
      "His feelings were complex and mixed."
    ],
    synonyms: ["complicated", "intricate"], antonyms: ["simple"] },

  { en: "concrete", cn: "具体的；混凝土", phon: "/ˈkɒŋkriːt/",
    examples: [
      "Give me a concrete example.",
      "The path is made of concrete.",
      "We need concrete evidence.",
      "Concrete is strong and durable.",
      "His plans are concrete and detailed."
    ],
    synonyms: ["specific", "definite"], antonyms: ["abstract", "vague"] },

  { en: "consider", cn: "考虑", phon: "/kənˈsɪdə(r)/",
    examples: [
      "Please consider my offer.",
      "She is considering changing jobs.",
      "We must consider the consequences.",
      "He considers himself lucky.",
      "Consider all options before deciding."
    ],
    synonyms: ["think about", "ponder"], antonyms: ["ignore", "disregard"] },

  { en: "correspond", cn: "符合；通信", phon: "/ˌkɒrəˈspɒnd/",
    examples: [
      "The results correspond to our predictions.",
      "His story does not correspond with hers.",
      "They have corresponded for years.",
      "Duties should correspond to pay.",
      "The two lists correspond exactly."
    ],
    synonyms: ["match", "agree"], antonyms: ["differ", "contradict"] },

  { en: "fortunate", cn: "幸运的", phon: "/ˈfɔːtʃənət/",
    examples: [
      "She was fortunate to escape injury.",
      "He is fortunate in having good friends.",
      "We are fortunate to live here.",
      "It was a fortunate coincidence.",
      "I was fortunate enough to win."
    ],
    synonyms: ["lucky", "blessed"], antonyms: ["unfortunate", "unlucky"] },

  { en: "output", cn: "产量；输出", phon: "/ˈaʊtpʊt/",
    examples: [
      "Factory output rose this year.",
      "The computer's output appears on screen.",
      "Creative output takes time.",
      "Input must match output in accounting.",
      "Agricultural output feeds the nation."
    ],
    synonyms: ["production", "yield"], antonyms: ["input"] },

  { en: "audience", cn: "观众", phon: "/ˈɔːdiəns/" },

  { en: "alongside", cn: "在旁边", phon: "/əˌlɒŋˈsaɪd/",
    examples: [
      "A car pulled up alongside ours.",
      "She works alongside her brother.",
      "The boat docked alongside the pier.",
      "Traditional crafts exist alongside modern industry.",
      "He walked alongside the river."
    ],
    synonyms: ["beside", "next to"], antonyms: [] },

  { en: "cheat", cn: "欺骗；作弊", phon: "/tʃiːt/",
    examples: [
      "He was caught cheating in the exam.",
      "Don't cheat on the test.",
      "She felt cheated by the deal.",
      "Cheat codes make games easier.",
      "It is wrong to cheat customers."
    ],
    synonyms: ["deceive", "trick"], antonyms: [] },

  { en: "feast", cn: "盛宴", phon: "/fiːst/",
    examples: [
      "They held a great feast for the wedding.",
      "The wedding feast lasted all night.",
      "A feast of music delighted the crowd.",
      "We feasted on roast turkey.",
      "The festival is a feast for the eyes."
    ],
    synonyms: ["banquet", "celebration"], antonyms: ["famine"] },

  { en: "abuse", cn: "滥用；虐待", phon: "/əˈbjuːz/",
    examples: [
      "Drug abuse ruins lives.",
      "The report exposed child abuse.",
      "He abused his power.",
      "Verbal abuse is never acceptable.",
      "Alcohol abuse harms the liver."
    ],
    synonyms: ["mistreat", "misuse"], antonyms: [] },

  { en: "acquire", cn: "获得" },

  /* ---- Rich entries for newly-added red words (5+ examples each) ---- */
  { en: "Brazilian", cn: "巴西的；巴西人",
    examples: [
      "She is a Brazilian student.",
      "Brazilian coffee is famous worldwide.",
      "The Brazilian football team won the cup.",
      "He speaks Brazilian Portuguese.",
      "Brazilian culture is vibrant and diverse."
    ],
    synonyms: ["of Brazil"], antonyms: [] },

  { en: "toothpaste", cn: "牙膏",
    examples: [
      "I bought a new tube of toothpaste.",
      "Squeeze some toothpaste onto the brush.",
      "This toothpaste protects against cavities.",
      "We ran out of toothpaste this morning.",
      "Mint toothpaste freshens your breath."
    ],
    etymology: "tooth + paste (a soft moist mixture).",
    synonyms: ["dentifrice"], antonyms: [] },

  { en: "consequence", cn: "后果；结果",
    examples: [
      "He must face the consequences of his actions.",
      "Pollution has serious consequences for health.",
      "Think about the consequence before you act.",
      "As a consequence, the project was delayed.",
      "The economic consequences were severe."
    ],
    etymology: "From Latin consequi, con- + sequi 'to follow'.",
    synonyms: ["result", "outcome"], antonyms: ["cause"] },

  { en: "appeal", cn: "呼吁；上诉；吸引",
    examples: [
      "The charity made an appeal for donations.",
      "She appealed against the court's decision.",
      "The design has wide appeal.",
      "They launched a fresh appeal to the public.",
      "The idea appeals to me."
    ],
    etymology: "From Latin ad- + pellere 'to drive toward'.",
    synonyms: ["plea", "attraction"], antonyms: [] },

  { en: "controversial", cn: "有争议的",
    examples: [
      "Abortion is a controversial issue.",
      "The film was highly controversial.",
      "He made a controversial remark.",
      "The policy proved controversial.",
      "Controversial topics spark debate."
    ],
    etymology: "From Latin controversus, 'turned against'.",
    synonyms: ["debatable", "disputed"], antonyms: ["undisputed"] },

  { en: "strive", cn: "奋斗；努力",
    examples: [
      "We must strive for excellence.",
      "She strove to finish on time.",
      "They strive to reduce waste.",
      "He strives hard to support his family.",
      "Strive to be your best self."
    ],
    etymology: "From Old French estriver, of Germanic origin.",
    synonyms: ["try", "endeavour"], antonyms: [] },

  { en: "sculpture", cn: "雕塑；雕刻",
    examples: [
      "The museum has a famous sculpture.",
      "She studied sculpture at art school.",
      "The sculpture was carved from marble.",
      "He sculpts in wood and stone.",
      "Modern sculpture takes many forms."
    ],
    etymology: "From Latin sculpere, 'to carve'.",
    synonyms: ["statue", "carving"], antonyms: [] },

  { en: "embassy", cn: "大使馆",
    examples: [
      "She works at the British Embassy.",
      "Protesters gathered outside the embassy.",
      "He went to the embassy to renew his passport.",
      "The embassy issued a travel warning.",
      "Diplomats met at the embassy."
    ],
    etymology: "From Latin ambactus, via Old French; related to 'ambassador'.",
    synonyms: ["mission", "consulate"], antonyms: [] },

  { en: "costume", cn: "服装；装束",
    examples: [
      "The actors wore traditional costumes.",
      "She wore a clown costume to the party.",
      "The costume designer won an award.",
      "National costumes vary by region.",
      "He hired a costume for the play."
    ],
    etymology: "From Italian costume, from Latin consuetudo 'custom'.",
    synonyms: ["outfit", "attire"], antonyms: [] },

  { en: "parallel", cn: "平行的；相似处",
    examples: [
      "The two roads run parallel.",
      "Draw a parallel line here.",
      "There are clear parallels between the events.",
      "Parallel parking is tricky.",
      "Their careers developed in parallel."
    ],
    etymology: "From Greek parallēlos, para- + allēlōn 'one another'.",
    synonyms: ["alongside", "matching"], antonyms: ["divergent"] }
];

/* Deduplicate by `en` (keep richest entry).
   Base layer = large auto-generated bank (window.__BANK, 5000+ words from
   official IELTS/CET6 vocab). Overlay = hand-written IELTS_WORDS with richer
   examples, etymology and synonyms for high-frequency words. */
const IELTS_BANK = (() => {
  const map = new Map();
  const mergeIn = (w) => {
    const key = (w.en || '').toLowerCase();
    if (!key) return;
    if (!map.has(key)) map.set(key, { ...w });
    else {
      const old = map.get(key);
      ['phon','etymology','examples','synonyms','antonyms','cn','def','pos','tags'].forEach(f => {
        if ((!old[f] || (Array.isArray(old[f]) && !old[f].length)) && w[f]) old[f] = w[f];
      });
    }
  };
  // 1) large base bank first
  (window.__BANK || []).forEach(mergeIn);
  // 2) then hand-written rich entries overlay (their richer fields win)
  IELTS_WORDS.forEach(w => {
    const key = w.en.toLowerCase();
    if (map.has(key)) {
      const old = map.get(key);
      // hand-written fields replace/supplement base data
      if (w.examples) old.examples = w.examples;
      if (w.etymology) old.etymology = w.etymology;
      if (w.synonyms) old.synonyms = w.synonyms;
      if (w.antonyms) old.antonyms = w.antonyms;
      if (w.phon) old.phon = w.phon;
      if (w.cn) old.cn = w.cn; // prefer the concise hand-written Chinese
    } else {
      mergeIn(w);
    }
  });
  return Array.from(map.values());
})();

/* Red words (seed for error bank) — ALL red words identified from yasi/ images.
   Each carries the student's original misspelling (for the "was: ..." badge).
   `img` records which worksheet image it came from. */
const SEED_ERROR_WORDS = [
  // --- already had rich hand-written data ---
  { en: "poisonous",    cn: "有毒的",    misspelled: "poisionous",   img: "7" },
  { en: "academic",     cn: "学术的",    misspelled: "accedemic",    img: "8" },
  { en: "theoretical",  cn: "理论的",    misspelled: "theoritical",  img: "12" },
  { en: "annually",     cn: "每年地",    misspelled: "anunally",     img: "1" },
  { en: "Russia",       cn: "俄罗斯",    misspelled: "Russcia",      img: "1" },

  // --- newly added from all remaining red words across images ---
  { en: "Brazilian",    cn: "巴西的；巴西人", misspelled: "Brazilain",    img: "1" },
  { en: "toothpaste",   cn: "牙膏",     misspelled: "toothbrush",   img: "6" },
  { en: "customs",      cn: "习俗；海关", misspelled: "custonms",    img: "7" },
  { en: "consequence",  cn: "后果",     misspelled: "concquance",   img: "7" },
  { en: "appeal",       cn: "呼吁；上诉", misspelled: "apeal",       img: "7" },
  { en: "application",  cn: "申请；应用", misspelled: "appliction",   img: "8" },
  { en: "controversial",cn: "有争议的",  misspelled: "conterversial",img: "8" },
  { en: "strive",       cn: "奋斗；努力", misspelled: "strave",       img: "8" },
  { en: "amusement",    cn: "娱乐",     misspelled: "ammusement",   img: "8" },
  { en: "dioxide",      cn: "二氧化物",  misspelled: "dioxcide",     img: "8" },
  { en: "sculpture",    cn: "雕塑",     misspelled: "scupclture",   img: "8" },
  { en: "embassy",      cn: "大使馆",    misspelled: "ambassy",      img: "20" },
  { en: "costume",      cn: "服装",     misspelled: "costunm",      img: "20" },
  { en: "parallel",     cn: "平行的",    misspelled: "parallal",     img: "20" },
  { en: "young",        cn: "年轻的",    misspelled: "yill",         img: "20" }
];

/* ---- Built-in CN→EN phrases for daily dictation ---- */
const IELTS_PHRASES = [
  { en: "take into account",       cn: "考虑到；把…计算在内" },
  { en: "in terms of",             cn: "就…而言；在…方面" },
  { en: "play a role in",          cn: "在…中起作用" },
  { en: "give rise to",            cn: "引起；导致" },
  { en: "be exposed to",           cn: "暴露于；接触到" },
  { en: "as a matter of fact",     cn: "事实上" },
  { en: "keep pace with",          cn: "与…并驾齐驱；跟上" },
  { en: "on the contrary",         cn: "相反" },
  { en: "in the long run",         cn: "从长远来看" },
  { en: "regardless of",           cn: "不管；不顾" },
  { en: "draw a conclusion",       cn: "得出结论" },
  { en: "be attributed to",        cn: "归因于" },
  { en: "to a certain extent",     cn: "在某种程度上" },
  { en: "be consistent with",      cn: "与…一致" },
  { en: "in addition to",          cn: "除…之外" },
  { en: "carry out",               cn: "执行；开展" },
  { en: "put forward",             cn: "提出" },
  { en: "focus on",                cn: "集中于；关注" },
  { en: "be aware of",             cn: "意识到" },
  { en: "as well as",              cn: "以及；也" }
];

/* ---- Confusable / similar word pairs for Cards module (contrast memory) ---- */
const SIMILAR_PAIRS = [
  { a: "poisonous",  b: "venomous",  note: "Both mean 'toxic', venomous usually for animals that inject poison." },
  { a: "academic",   b: "academician", note: "academic = 学院的/学术的; academician = 院士/学会会员." },
  { a: "theoretical", b: "theatre",   note: "theoretical = 理论的 (theory); theatre = 剧院. Don't confuse spelling." },
  { a: "annually",   b: "annul",     note: "annually = 每年; annul = 废除/取消. Same root 'year' vs 'null'." },
  { a: "receive",    b: "perceive",  note: "receive = 收到; perceive = 察觉/理解. Both -ceive verbs." },
  { a: "affect",     b: "effect",    note: "affect (v) 影响; effect (n) 效果. Classic IELTS confusion." },
  { a: "principle",  b: "principal", note: "principle = 原则; principal = 校长/主要的." },
  { a: "compliment", b: "complement",note: "compliment = 赞美; complement = 补充." },
  { a: "stationary", b: "stationery",note: "stationary = 静止的; stationery = 文具." },
  { a: "adapt",      b: "adopt",     note: "adapt = 适应; adopt = 收养/采纳." },
  { a: "desert",     b: "dessert",   note: "desert = 沙漠; dessert = 甜点 (the sweeter one has more s)." },
  { a: "council",    b: "counsel",   note: "council = 议会; counsel = 忠告/律师." }
];

/* Expose globally */
window.IELTS = {
  BANK: IELTS_BANK,
  SEED_ERRORS: SEED_ERROR_WORDS,
  PHRASES: IELTS_PHRASES,
  PAIRS: SIMILAR_PAIRS
};
