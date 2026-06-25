/* ============================================================
   STATESIDE — lesson content
   General American (GenAm) pronunciation reference
   ============================================================ */

const SOUNDS = [
  {
    ipa: "ɹ",
    title: "The American R",
    sub: "Rhotic / r-colored",
    tip: "The #1 giveaway of an American accent. Americans pronounce <b>every</b> R, including at the end of words. <b>Bunch</b> the back of your tongue up and back — don't let the tip touch the roof of your mouth — and round your lips slightly. It should feel almost like a low growl.",
    words: ["car", "hard", "four", "bird", "world", "doctor", "summer", "river"],
    sentences: ["Mark parked the car in the yard.", "The early bird works harder."],
    pairs: [["cart","caught"], ["here","hear"], ["four","for"]]
  },
  {
    ipa: "ɾ",
    title: "The Flap T",
    sub: "water → \"wadder\"",
    tip: "When <b>T</b> (or <b>TT</b>) sits between two vowels, Americans tap it into a quick, soft <b>D</b> sound — a single flick of the tongue. \"Water\" becomes \"wah-der\", \"better\" becomes \"bedder\". This single habit instantly softens your accent.",
    words: ["water", "butter", "better", "city", "little", "party", "thirty", "daughter"],
    sentences: ["I bought a little bottle of water.", "Betty got a better letter."],
    pairs: [["latter","ladder"], ["writer","rider"]]
  },
  {
    ipa: "θ ð",
    title: "TH — Think & This",
    sub: "voiceless θ · voiced ð",
    tip: "Put your tongue tip lightly <b>between your teeth</b> and push air. \"Think\" is voiceless (just air). \"This\" is voiced (buzz in your throat). Don't swap them for S, Z, F, or D — that's the most common TH mistake.",
    words: ["think", "three", "both", "mouth", "this", "that", "mother", "breathe"],
    sentences: ["I think those are their things.", "The weather brothers gather together."],
    pairs: [["think","sink"], ["three","free"], ["they","day"], ["thin","fin"]]
  },
  {
    ipa: "æ",
    title: "Short A",
    sub: "cat · trap · hand",
    tip: "Drop your jaw and spread your lips wide, like the start of a yell. It's brighter and more open than in many languages — almost a blend of \"eh\" and \"a\". Keep it distinct from the \"e\" in <b>bed</b>.",
    words: ["cat", "bad", "hand", "man", "apple", "ask", "last", "happy"],
    sentences: ["The cat sat on a black hat.", "Sam has bad handwriting."],
    pairs: [["bad","bed"], ["man","men"], ["sat","set"], ["had","head"]]
  },
  {
    ipa: "ə",
    title: "The Schwa",
    sub: "the lazy vowel — rhythm key",
    tip: "The most common sound in English. Unstressed syllables relax into a quick, neutral \"uh\". This is the secret to American <b>rhythm</b>: stress the important words hard and let the small words shrink. \"banana\" → buh-NAN-uh.",
    words: ["banana", "about", "sofa", "support", "problem", "camera"],
    sentences: ["I can have a banana.", "She was about to ask for support."],
    pairs: [["the","thee"], ["a","ay"]]
  },
  {
    ipa: "iː ɪ",
    title: "Sheep & Ship",
    sub: "tense iː · lax ɪ",
    tip: "<b>iː</b> (sheep) is long and tense — smile and stretch it. <b>ɪ</b> (ship) is short, relaxed, and lower. Mixing these up changes the word entirely (\"beach\" vs \"…\", \"sheet\" vs \"…\"). When in doubt, make the long one longer.",
    words: ["sheep", "ship", "seat", "sit", "feel", "fill", "leave", "live"],
    sentences: ["The sheep is on the ship.", "I feel like I should fill it."],
    pairs: [["sheep","ship"], ["seat","sit"], ["feel","fill"], ["heat","hit"]]
  },
  {
    ipa: "ɫ",
    title: "The Dark L",
    sub: "milk · cold · ball",
    tip: "At the <b>end</b> of a syllable, the American L gets \"dark\": pull the back of your tongue up toward your throat, adding an \"oo\"/\"ull\" color. \"Milk\" sounds almost like \"miulk\", \"cold\" like \"coʊld\".",
    words: ["milk", "cold", "ball", "feel", "well", "people", "table", "real"],
    sentences: ["The cold milk is on the table.", "All the people feel well."],
    pairs: [["full","fool"], ["pull","pool"]]
  },
  {
    ipa: "oʊ",
    title: "The O Diphthong",
    sub: "go · boat · know",
    tip: "American \"O\" isn't a single pure vowel — it <b>glides</b> from \"oh\" toward \"oo\", with the lips rounding at the end. \"Go\" is really \"goʊ\". Letting it glide keeps it from sounding flat or foreign.",
    words: ["go", "boat", "know", "home", "phone", "road", "open", "slow"],
    sentences: ["I know the road home.", "Don't go slow on the open road."],
    pairs: [["coat","caught"], ["boat","bought"]]
  }
];

const SHADOW = [
  { formal: "What are you doing?", casual: "Whatcha doin'?", note: "<b>What are you</b> collapses to \"whatcha\". Drop the final g: <span class='ipa'>/ˈwʌtʃə ˈduɪn/</span>" },
  { formal: "I am going to call you.", casual: "I'm gonna call ya.", note: "<b>going to</b> → \"gonna\"; <b>you</b> → \"ya\". The most American reduction there is." },
  { formal: "I want to go home.", casual: "I wanna go home.", note: "<b>want to</b> → \"wanna\". Say it as one smooth word." },
  { formal: "Did you eat yet?", casual: "Jeet yet?", note: "Casual American crushes \"did you eat\" right down to \"jeet\". Classic." },
  { formal: "Let me see it.", casual: "Lemme see it.", note: "<b>let me</b> → \"lemme\". Link \"see it\" → <span class='ipa'>\"see-it\"</span> with no gap." },
  { formal: "I have got to leave.", casual: "I gotta leave.", note: "<b>got to</b> → \"gotta\". Drop the \"have\" entirely in speech." },
  { formal: "Could you help me out?", casual: "Couldja help me out?", note: "<b>could you</b> → \"couldja\" — the d+y blends into a \"j\" sound." },
  { formal: "It is kind of cold.", casual: "It's kinda cold.", note: "<b>kind of</b> → \"kinda\"; <b>sort of</b> → \"sorta\". Softens the whole sentence." },
  { formal: "Turn it off, please.", casual: "Tur-ni-toff, please.", note: "<b>Linking:</b> a final consonant grabs the next vowel. \"Turn it off\" flows as \"tur-ni-toff\"." },
  { formal: "I do not know.", casual: "I dunno.", note: "<b>don't know</b> → \"dunno\". Stress falls on the last part: <span class='ipa'>/dəˈnoʊ/</span>" }
];

/* Scripted conversation partners. The engine walks the `script`,
   adds a reactive opener based on keywords, and falls back to
   open follow-ups so it never dead-ends. */
const SCENARIOS = [
  {
    id: "coffee", emoji: "☕", title: "Coffee Shop",
    persona: "a friendly barista",
    opener: "Hey there, welcome in! What can I get started for you today?",
    script: [
      "Good choice. What size would you like — small, medium, or large?",
      "You got it. For here or to go?",
      "Can I get a name for the order?",
      "Awesome. That'll be four fifty. Anything else for you today?",
      "Perfect, I'll have that right up for you. Have a great one!"
    ],
    reactions: {
      "latte|coffee|cappuccino|espresso|tea|mocha|americano": "Mmm, great pick.",
      "thank": "Of course, happy to help!",
      "large|big": "Nice, that'll keep you going.",
      "card|cash": "No problem, whenever you're ready."
    }
  },
  {
    id: "smalltalk", emoji: "👋", title: "Small Talk",
    persona: "a friendly new acquaintance at an event",
    opener: "Hi! I don't think we've met — I'm Alex. How's your day going?",
    script: [
      "Nice to meet you! So what brings you here today?",
      "Oh interesting! And what do you do, if you don't mind me asking?",
      "That sounds really cool. How long have you been doing that?",
      "Wow, nice. Have you lived around here a while?",
      "Well, it's been great chatting with you. Let's grab coffee sometime!"
    ],
    reactions: {
      "good|great|fine|well|okay": "Glad to hear it!",
      "student|study|phd|school|university": "Oh, a student — that's awesome.",
      "work|engineer|teacher|developer|research": "Nice, that's a great field.",
      "nice to meet|you too": "Likewise!"
    }
  },
  {
    id: "interview", emoji: "💼", title: "Job Interview",
    persona: "a warm hiring manager",
    opener: "Thanks for coming in today. To start, could you tell me a little about yourself?",
    script: [
      "Great background. What made you interested in this particular role?",
      "I like that. Can you tell me about a challenge you faced and how you handled it?",
      "That's a strong example. Where do you see yourself in a few years?",
      "Good to know. Do you have any questions for me about the team or the role?",
      "Wonderful. We'll be in touch soon — thanks again for your time!"
    ],
    reactions: {
      "experience|year|worked": "That's valuable experience.",
      "team|collaborate|together": "We really value teamwork here.",
      "learn|grow|improve": "A growth mindset — exactly what we look for.",
      "thank": "My pleasure."
    }
  },
  {
    id: "restaurant", emoji: "🍽️", title: "At a Restaurant",
    persona: "an attentive server",
    opener: "Hi, welcome! Can I start you off with something to drink?",
    script: [
      "Sounds good. Are you ready to order, or do you need a few more minutes?",
      "Great choice — and how would you like that cooked?",
      "Perfect. Would you like any sides with that?",
      "You got it. I'll put that right in for you. Anything else?",
      "Wonderful, I'll be back with your food shortly. Enjoy!"
    ],
    reactions: {
      "water|soda|wine|beer|juice|coffee": "Coming right up.",
      "burger|steak|chicken|pasta|salad|fish": "Excellent choice, that's a popular one.",
      "thank": "Absolutely!",
      "recommend|suggest|special": "Honestly, the special today is fantastic."
    }
  },
  {
    id: "directions", emoji: "🗺️", title: "Asking Directions",
    persona: "a helpful local",
    opener: "You look a little lost — need a hand finding something?",
    script: [
      "Sure, I can help with that! Are you on foot or driving?",
      "Okay, so it's not too far. Head straight down this street for two blocks.",
      "Then take a right at the light — you'll see it on your left.",
      "You really can't miss it. Does that make sense?",
      "No problem at all. Have a great day, and good luck!"
    ],
    reactions: {
      "station|airport|hotel|museum|park|store|restaurant": "Oh sure, I know exactly where that is.",
      "walk|foot|driving|car": "Got it.",
      "thank": "Happy to help!",
      "lost|confused": "Don't worry, it's easy once you know."
    }
  },
  {
    id: "plans", emoji: "📅", title: "Making Plans",
    persona: "a close friend on the phone",
    opener: "Hey! It's been forever. Want to hang out this weekend?",
    script: [
      "Awesome! Are you thinking Saturday or Sunday?",
      "Works for me. What do you feel like doing — food, a movie, something outdoors?",
      "Ooh, I'm down for that. What time should we meet up?",
      "Perfect. Want me to pick you up, or should we just meet there?",
      "Sweet, it's a plan! Can't wait — see you then!"
    ],
    reactions: {
      "saturday|sunday|weekend": "Nice, that works great.",
      "movie|dinner|lunch|hike|park|game": "Oh that sounds fun!",
      "yes|sure|sounds good|yeah": "Awesome!",
      "busy|can't|maybe": "No worries, we'll find a time."
    }
  }
];
