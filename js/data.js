/* ------------------------------------------------------------------
   Game Teardowns - content
   Every teardown follows the same template (see README.md).
   To add a game, copy one object in TEARDOWNS and edit it.
------------------------------------------------------------------- */

window.TEARDOWN_META = {
  author: "Santiago Negro",
  portfolio: "https://santidark.github.io/SantiagoNegro-Portfolio/",
  /* Public GitHub repository of this site, e.g. "https://github.com/USER/game-teardowns".
     While it is empty, the editor offers "Download file" but not "Send to the site". */
  repo: "https://github.com/SantiDark/game-teardowns",
  disclaimer:
    "Independent design analysis. All diagrams are original, and teardowns use no game assets. Cover images on profiles are shown from Wikipedia. Titles and covers belong to their respective owners.",

  layers: [
    { id: "Mechanic", def: "An action the player performs, such as rolling, parrying or crafting." },
    { id: "System", def: "Rules that connect mechanics and resources, such as stamina, scarcity or approval." },
    { id: "Content", def: "The authored material the rules are applied to: enemies, levels and encounters." },
    { id: "Narrative", def: "How story and character are delivered, and how choices change them." },
    { id: "Presentation", def: "How the game shows and sounds what is happening: camera, UI, audio and animation." }
  ],

  compareRows: [
    { key: "genre", label: "Genre" },
    { key: "tension", label: "Main source of tension" },
    { key: "failure", label: "What failure costs" },
    { key: "info", label: "Information given to the player" },
    { key: "progression", label: "Progression" },
    { key: "feedback", label: "Main feedback channel" },
    { key: "onboarding", label: "Onboarding" }
  ],

  compareInsight: [
    "All three games turn resources into decisions, but they handle information differently. The Last of Us limits what the player knows, Dark Souls expects the player to learn it through repetition, and Baldur's Gate 3 puts the numbers on screen.",
    "Failure also has a different shape in each one. Dark Souls makes it a cost the player can recover from, Baldur's Gate 3 often turns it into a story branch, and The Last of Us treats it as a reason to rethink the approach.",
    "For my own projects, the useful question is not which approach is best, but which one matches the experience I want the player to have."
  ],

  /* Design problems, shown on the Problems page. A system answers a problem
     when its "problems" list includes the problem id, for example
       systems: [{ name: "Bonfires", ..., problems: ["fair-failure"] }]
     Format of each problem:
       { id: "fair-failure",
         name: "Make failure feel fair",
         question: "How do I let the player die without making them quit?",
         idea: "One or two sentences about what is at stake." } */
  problems: []
};

window.TEARDOWNS = [
  /* ===================================================================
     THE LAST OF US PART I
  =================================================================== */
  {
    slug: "the-last-of-us-part-i",
    title: "The Last of Us Part I",
    studio: "Naughty Dog",
    year: "2022 (remake of the 2013 original)",
    genre: "Action-adventure / survival",
    tags: ["Stealth", "Survival", "Narrative"],
    hook: "Scarcity and sound turn every encounter into a decision about what to spend.",
    compare: {
      tension: "Scarcity and vulnerability.",
      failure: "The player returns to a recent checkpoint and rethinks the approach.",
      info: "Limited and partly chosen, through sound, animation and listen mode.",
      progression: "Weapon upgrades and skills paid for with found resources.",
      feedback: "Audio and enemy animation.",
      onboarding: "One new verb at a time, introduced in low-risk moments."
    },
    summary:
      "The Last of Us Part I is a linear survival game where combat is a last resort. Ammo, health items and crafting materials are limited, so the player keeps deciding whether an encounter is worth its cost. Stealth, sound and a protective relationship with a companion keep the player feeling vulnerable instead of powerful. The loop works because every resource decision connects to a risk the player can see and hear.",
    fantasy:
      "Surviving as a vulnerable person who is protecting someone, not as a soldier who dominates the space.",
    facts: [
      { k: "Perspective", v: "Third person" },
      { k: "Structure", v: "Linear chapters" },
      { k: "Combat", v: "Stealth and gunplay with scarce ammo" },
      { k: "Failure cost", v: "Return to a recent checkpoint" }
    ],

    coreLoop: {
      note:
        "The loop repeats inside every chapter. What changes from one chapter to the next is the space, the enemy mix and how much the player has left in the backpack.",
      steps: [
        {
          label: "Explore",
          detail: "The player moves through a space, reads the environment and looks for routes.",
          feeling: "Curiosity with a low level of dread."
        },
        {
          label: "Scavenge",
          detail: "Ammo, scrap and parts are picked up. Because supplies are limited, every pickup changes what the player can afford later.",
          feeling: "Small relief, followed by a calculation of what is still missing."
        },
        {
          label: "Assess",
          detail: "The player reads the encounter: where the enemies are, what routes exist and what can be heard. Listening is part of planning.",
          feeling: "Focus and tension before anything happens."
        },
        {
          label: "Engage",
          detail: "The player chooses between stealth, an ambush or a fight. Each option spends something different: time, items, ammo or health.",
          feeling: "Risk, because the player has chosen what to put at stake."
        },
        {
          label: "Recover",
          detail: "Healing and crafting happen in real time, so the player is exposed while doing them.",
          feeling: "Urgency, and relief when it works."
        },
        {
          label: "Upgrade",
          detail: "Parts and supplements are spent at safe points to improve weapons and abilities, then the player moves on.",
          feeling: "A sense of progress that stays small compared to the threat."
        }
      ]
    },

    systems: [
      {
        name: "Scarce resources",
        layer: "System",
        what: "Ammo, crafting materials and health items are limited in every chapter.",
        why: "It makes each encounter a choice instead of a default fight.",
        effect: "The player weighs whether to avoid, ambush or shoot, and often chooses the cheaper option."
      },
      {
        name: "Real-time crafting and healing",
        layer: "Mechanic",
        what: "Using the backpack does not pause the game.",
        why: "It makes preparation costly by tying it to exposure.",
        effect: "The player has to find a safe moment to heal or craft, which adds a second layer of planning."
      },
      {
        name: "Enemy types with different answers",
        layer: "Content",
        what: "Infected types such as Runners, Clickers and Bloaters, plus human enemies, ask for different responses.",
        why: "A single strategy would not work, so the player keeps adapting.",
        effect: "Clickers, which hunt by sound, push the player toward quiet movement. Bloaters push toward distance or special tools."
      },
      {
        name: "Listen mode",
        layer: "Mechanic",
        what: "The player can detect nearby enemies through walls while using it.",
        why: "It turns information into a tool the player chooses to use.",
        effect: "It gives the player a clearer plan, and difficulty settings can change how much help it provides."
      },
      {
        name: "Companion behavior",
        layer: "System",
        what: "Allies fight alongside the player, and enemies do not detect them during stealth.",
        why: "It favors flow over realism so the player is never punished for the companion's behavior.",
        effect: "The companion adds personality and support without breaking the stealth plan."
      },
      {
        name: "Weapon and skill upgrades",
        layer: "System",
        what: "Parts and tools improve weapons at workbenches, and supplements improve the character's abilities.",
        why: "It gives scavenging a long-term purpose beyond immediate survival.",
        effect: "The player has to choose what to improve with limited resources."
      },
      {
        name: "Environmental storytelling",
        layer: "Narrative",
        what: "Notes, objects and the state of spaces tell what happened before the player arrived.",
        why: "It delivers story during exploration without interrupting play.",
        effect: "Searching for supplies also becomes a way to learn about the world."
      },
      {
        name: "Sound as information",
        layer: "Presentation",
        what: "Enemy audio, music changes and spoken callouts tell the player what is happening.",
        why: "Audio can warn the player without adding more interface.",
        effect: "A clicking sound or a change in music makes the player react before seeing anything."
      }
    ],

    feedback: {
      visual: [
        "Listen mode outlines enemies through walls.",
        "Enemy animation shows their state, such as searching or alerted.",
        "Prompts appear near interactable objects instead of on a fixed HUD."
      ],
      audio: [
        "Clicking sounds identify enemies that hunt by sound.",
        "Music changes when stealth turns into combat.",
        "Spoken callouts from enemies and allies give positional information."
      ],
      mechanical: [
        "Running out of ammo forces a different approach.",
        "Melee weapons can break, which limits reliance on them.",
        "Crafting while enemies are near leaves the player exposed."
      ]
    },

    onboarding: {
      summary:
        "New verbs tend to appear in low-risk moments before the player needs them under pressure. Movement and interaction come first, then stealth and crafting once there is a reason to use them, and stronger enemy types after the basics are familiar.",
      steps: [
        "Movement and interaction in safe spaces.",
        "Basic combat against weaker enemies.",
        "Stealth and crafting once resources matter.",
        "Stronger enemies that change the rules of an encounter."
      ],
      difficulty:
        "Higher difficulty settings tighten resources and the information the player receives, instead of only raising enemy damage. This keeps the same loop but makes each decision heavier."
    },

    pacing: {
      label: "Typical chapter shape. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Arrival", v: 2, note: "A quiet moment that sets the space and the mood." },
        { phase: "Exploration", v: 3, note: "The player searches and learns the layout." },
        { phase: "First encounter", v: 6, note: "The player makes the first resource decision of the chapter." },
        { phase: "Aftermath", v: 2, note: "Recovery, crafting and conversation." },
        { phase: "Set piece", v: 8, note: "A larger encounter or sequence that raises the stakes." },
        { phase: "Travel and dialogue", v: 3, note: "Low pressure, used to develop the characters." },
        { phase: "Major encounter", v: 9, note: "The highest pressure of the chapter." },
        { phase: "Calm", v: 2, note: "Release before the next chapter starts." }
      ]
    },

    tensions: [
      {
        title: "Realism against flow",
        text: "Enemies ignoring the companion during stealth is not realistic, but it prevents frustration. The design chooses playability over simulation here."
      },
      {
        title: "Scarcity depends on uncertainty",
        text: "Resource pressure works best when the player does not know the encounter. On a replay, knowledge reduces uncertainty and the same loop feels lighter."
      }
    ],

    takeaways: [
      {
        feeling: "Exposure while doing something useful",
        source: "Real-time crafting and healing.",
        adaptation:
          "In a horror prototype, make interactions such as inspecting a note or opening a drawer take time, so the player decides when it is safe to do them.",
        project: "The Last Way Out",
        test: "Do players wait for a safe moment before interacting, or do they ignore the risk?"
      },
      {
        feeling: "Sound as a threat the player can control",
        source: "Enemies that hunt by sound.",
        adaptation:
          "Keep the sound-based chase, but make the player's own noise readable through movement states such as sprint and crouch, with a subtle indicator.",
        project: "The Last Way Out",
        test: "Can a new player explain why the enemy found them?"
      },
      {
        feeling: "Calm after tension",
        source: "The rhythm between encounters and quiet traversal.",
        adaptation:
          "Use long, quiet stretches to let found objects and conversations carry the story, so the tension of the world makes them matter more.",
        project: "ROADS",
        test: "Do players stop to look at objects on their own during quiet sections?"
      }
    ]
  },

  /* ===================================================================
     DARK SOULS
  =================================================================== */
  {
    slug: "dark-souls",
    title: "Dark Souls",
    studio: "FromSoftware",
    year: "2011",
    genre: "Action RPG",
    tags: ["Melee combat", "Level design", "Difficulty"],
    hook: "Every attack is a commitment, and the world teaches the player to read it.",
    compare: {
      tension: "Execution under pressure, and unspent souls at risk.",
      failure: "Souls are dropped at the place of death and can be recovered once.",
      info: "Learned through observation and repetition, with little explanation.",
      progression: "Souls spent on levels and upgrades, plus shortcuts that open the world.",
      feedback: "Enemy animation telegraphs and the stamina bar.",
      onboarding: "A tutorial area with in-world messages, ending in a first boss."
    },
    summary:
      "Dark Souls is an action RPG built around committed melee combat. Attacks, rolls and blocks spend stamina and cannot be freely canceled, so every action carries risk. Bonfires act as checkpoints and as a way to trade progress for safety, because resting resets most enemies. The game explains very little directly and relies on observation, repetition and a world designed to loop back on itself.",
    fantasy:
      "Learning to survive in a hostile world through observation, patience and persistence.",
    facts: [
      { k: "Perspective", v: "Third person" },
      { k: "Structure", v: "Interconnected world with shortcuts" },
      { k: "Combat", v: "Melee, stamina-based, with lock-on" },
      { k: "Failure cost", v: "Souls are dropped where the player died" }
    ],

    coreLoop: {
      note:
        "Death is not outside the loop. It sends the player back to the last bonfire with a chance to recover what was lost, which makes the next attempt feel higher stakes.",
      steps: [
        {
          label: "Explore",
          detail: "The player moves through an area, looking for paths, items and threats.",
          feeling: "Caution, because the next enemy could be dangerous."
        },
        {
          label: "Engage",
          detail: "The player reads an enemy's pattern, then commits to an attack, a block, a roll or a parry.",
          feeling: "Focus and risk on every action."
        },
        {
          label: "Gain souls",
          detail: "Defeating enemies gives souls, which work as both currency and experience.",
          feeling: "A reward that is also something to protect."
        },
        {
          label: "Decide",
          detail: "The player chooses between pushing on with unspent souls or going back to a bonfire to use them.",
          feeling: "Greed against safety."
        },
        {
          label: "Rest",
          detail: "At a bonfire the player recovers, refills the healing flask and resets most enemies in the area.",
          feeling: "Relief, with the cost of facing enemies again."
        },
        {
          label: "Spend",
          detail: "Souls are used to level up or to upgrade equipment, which prepares the player for the next area.",
          feeling: "A tangible sense of getting stronger."
        }
      ]
    },

    systems: [
      {
        name: "Stamina",
        layer: "Mechanic",
        what: "Attacking, rolling and blocking spend a stamina bar that recovers over time.",
        why: "It limits spamming and forces the player to choose when to be aggressive.",
        effect: "The player thinks about the next opening instead of repeating attacks."
      },
      {
        name: "Animation commitment",
        layer: "Mechanic",
        what: "Attacks and dodges have wind-up and recovery that cannot be freely canceled.",
        why: "It creates risk and reward for every action and makes enemy patterns fair to read.",
        effect: "The player learns to attack in safe windows and to avoid greed."
      },
      {
        name: "Lock-on",
        layer: "Mechanic",
        what: "The camera and movement center on a single target.",
        why: "It makes spacing and timing readable in one-on-one fights.",
        effect: "The player focuses on distance and enemy animation instead of managing the camera."
      },
      {
        name: "Parry and riposte",
        layer: "Mechanic",
        what: "A well-timed parry, typically with a small shield, opens the enemy to a strong follow-up attack.",
        why: "It rewards mastery with a high-risk option that gives a large payoff.",
        effect: "Some players adopt it as their main style, while others avoid it for safety."
      },
      {
        name: "Bonfires",
        layer: "System",
        what: "Bonfires are checkpoints that refill healing and reset most enemies in the area.",
        why: "They create safe points and make resting a decision with a cost.",
        effect: "The player has to balance progress and safety during each expedition."
      },
      {
        name: "Soul loss and recovery",
        layer: "System",
        what: "On death the player drops their souls at the place of death, and dying again before recovering them loses them for good.",
        why: "It adds stakes to unspent souls without ending the run.",
        effect: "The player takes more care on the way back to the place of death."
      },
      {
        name: "Interconnected world and shortcuts",
        layer: "Content",
        what: "Areas connect in loops, and opening a shortcut removes the risk of repeating a route.",
        why: "It turns exploration into progress the player can feel.",
        effect: "A hard area becomes more familiar with each return."
      },
      {
        name: "Boss encounters",
        layer: "Content",
        what: "Bosses are set pieces that test the skills the player has learned in the area before them.",
        why: "They act as exams that mark the end of a section.",
        effect: "Victory feels like a result of learning, not only of numbers."
      },
      {
        name: "Item-based narrative",
        layer: "Narrative",
        what: "Item descriptions and environments carry most of the story, with little direct explanation.",
        why: "It keeps the story out of the way of play and rewards curiosity.",
        effect: "Players who read and explore understand more than those who do not."
      },
      {
        name: "Readable enemy animation",
        layer: "Presentation",
        what: "Enemy wind-ups telegraph attacks before they land.",
        why: "It makes difficulty feel fair, because the information is on screen.",
        effect: "The player blames their timing rather than the game."
      }
    ],

    feedback: {
      visual: [
        "Enemy wind-up animations telegraph attacks.",
        "A full-screen death message makes failure unmistakable.",
        "Stamina and health bars are the main persistent information."
      ],
      audio: [
        "Distinct sounds mark hits, blocks and parries.",
        "Boss music starts when the encounter begins, which marks a change in stakes.",
        "Environmental audio signals nearby threats."
      ],
      mechanical: [
        "Blocking an attack drains stamina, and a depleted bar breaks the guard.",
        "Heavy hits stagger the player.",
        "Using the healing flask leaves the player vulnerable during the animation."
      ]
    },

    onboarding: {
      summary:
        "The opening area works as a tutorial. Controls are taught with messages placed in the world instead of long menus, and the section ends with a boss that tests the basics. After that, the game trusts the player to learn from failure.",
      steps: [
        "Controls shown through in-world messages.",
        "A safe area for practicing movement and combat.",
        "A first boss that tests the basics.",
        "A hub that gives the player their first choice of direction."
      ],
      difficulty:
        "There is no difficulty selector. Challenge is fixed, and the player adjusts it through build choices, grinding or calling for help from other players."
    },

    pacing: {
      label: "Typical exploration section. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Exploration", v: 3, note: "Slow movement while scanning for threats." },
        { phase: "Enemy group", v: 5, note: "A small fight that tests recent learning." },
        { phase: "Ambush", v: 7, note: "A surprise that tests the player's reactions." },
        { phase: "Bonfire", v: 2, note: "A rest point that releases tension." },
        { phase: "Boss approach", v: 6, note: "Tension builds as the area changes." },
        { phase: "Boss fight", v: 10, note: "The highest pressure, with the entire loop concentrated." },
        { phase: "Victory", v: 2, note: "Release, followed by new areas to open." }
      ]
    },

    tensions: [
      {
        title: "Challenge against tedium",
        text: "The soul recovery rule is mild enough to encourage another try, but a long run back to a boss can turn the penalty into repetition."
      },
      {
        title: "Quiet storytelling against clarity",
        text: "Telling the story through items and places rewards curious players, but others may finish the game without understanding much of it."
      },
      {
        title: "A fixed difficulty",
        text: "Having no selector protects the design intent, but it also means the only adjustments are player choices outside the game's own options."
      }
    ],

    takeaways: [
      {
        feeling: "Every action has a cost",
        source: "Animation commitment and stamina.",
        adaptation:
          "In a melee prototype with parry and block, give attacks a clear wind-up and recovery, and decide how long a missed parry leaves the player exposed.",
        project: "Counterpoint",
        test: "Can players tell whether they lost a fight because of timing or because of the game?"
      },
      {
        feeling: "Fair difficulty",
        source: "Readable enemy telegraphs.",
        adaptation:
          "Give each enemy type in a wave a distinct wind-up pose and sound, so the player can learn to prioritize.",
        project: "Counterpoint",
        test: "After one wave, can a player name the attack they just avoided?"
      },
      {
        feeling: "Safe points as a decision",
        source: "Bonfires.",
        adaptation:
          "Use a safe place as a pacing tool in a horror prototype, so the player chooses when to take a risk and when to pause.",
        project: "The Last Way Out",
        test: "Do players return to the safe place voluntarily, or only when they have to?"
      }
    ]
  },

  /* ===================================================================
     BALDUR'S GATE 3
  =================================================================== */
  {
    slug: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    studio: "Larian Studios",
    year: "2023",
    genre: "Computer RPG, turn-based",
    tags: ["Choices", "Turn-based", "Narrative"],
    hook: "The game shows the odds, then lets the story change around whatever happens.",
    compare: {
      tension: "Uncertainty from the dice, and the consequences of choices.",
      failure: "Failed rolls often change the story, and a lost fight can be reloaded.",
      info: "Explicit: odds, ranges and rules are shown on screen.",
      progression: "Character levels, spells, gear and companion relationships.",
      feedback: "On-screen numbers, dice and voiced reactions.",
      onboarding: "A prologue with pop-up tips, learned by doing."
    },
    summary:
      "Baldur's Gate 3 is a role-playing game based on the rules of Dungeons & Dragons 5th edition. Exploration and conversation happen in real time, while fights switch to turn-based combat. The player gets many ways to solve a situation, and the result of each approach is decided by visible dice rolls and modifiers. Companions and dialogue react to the choices the player has made, which makes the story feel personal.",
    fantasy:
      "Being the author of your own story through creative problem solving.",
    facts: [
      { k: "Perspective", v: "Overhead camera" },
      { k: "Structure", v: "Open areas with branching quests" },
      { k: "Combat", v: "Turn-based, based on D&D 5th edition" },
      { k: "Co-op", v: "Single player or online with up to four players" }
    ],

    coreLoop: {
      note:
        "The loop is wide because each step can be solved in several ways. The long rest closes it with a scene, so resources and story move forward together.",
      steps: [
        {
          label: "Explore and talk",
          detail: "The player moves through the world, meets characters and finds problems.",
          feeling: "Curiosity about what the situation allows."
        },
        {
          label: "Choose an approach",
          detail: "The player decides whether to talk, sneak, fight or use items and spells.",
          feeling: "Ownership, because the choice is the player's."
        },
        {
          label: "Resolve",
          detail: "A d20 roll with modifiers decides most checks, and combat follows turn-based rules.",
          feeling: "Suspense while the dice are rolling."
        },
        {
          label: "See consequences",
          detail: "The story, the party's opinion and the state of the world change as a result.",
          feeling: "Weight, because the outcome matters later."
        },
        {
          label: "Loot and build",
          detail: "The player gets gear, experience, spells and abilities, and decides how to build the character.",
          feeling: "Anticipation about what the build can do next."
        },
        {
          label: "Long rest",
          detail: "Resting at camp spends supplies, restores resources and often triggers scenes with companions.",
          feeling: "Calm, plus a reason to care about the party."
        }
      ]
    },

    systems: [
      {
        name: "Dice-based resolution",
        layer: "Mechanic",
        what: "Checks use a visible d20 roll plus modifiers against a target number.",
        why: "It makes odds transparent and lets chance create drama.",
        effect: "A failed roll can create a new story instead of a dead end."
      },
      {
        name: "Action economy",
        layer: "Mechanic",
        what: "Each turn the player has an action, a bonus action, movement and a reaction.",
        why: "It gives combat a clear structure that the player can optimize.",
        effect: "Turns become puzzles about the best use of limited options."
      },
      {
        name: "Environmental interaction",
        layer: "System",
        what: "Surfaces such as fire, water, oil and electricity interact with each other, and high ground gives bonuses.",
        why: "It creates a rule set the player can exploit creatively.",
        effect: "The player starts to look at the space as a tool."
      },
      {
        name: "Character building",
        layer: "System",
        what: "Class, race, background, spells and gear shape what the character can do.",
        why: "It gives the player ownership before a fight even starts.",
        effect: "Different builds solve the same problem in different ways."
      },
      {
        name: "Companions and approval",
        layer: "System",
        what: "Party members have their own quests and react to the player's actions.",
        why: "It turns the party into a relationship the player has to manage.",
        effect: "Choices are weighed against how companions might react."
      },
      {
        name: "Camp and long rest",
        layer: "System",
        what: "Resting uses supplies, restores resources and often triggers companion scenes.",
        why: "It ties resource management to character development.",
        effect: "Resting is both a tactical decision and a story beat."
      },
      {
        name: "Multiple solutions to encounters",
        layer: "Content",
        what: "Many encounters can be solved by talking, sneaking or fighting.",
        why: "It supports the fantasy of authorship.",
        effect: "Replays feel different because the same situation has several valid answers."
      },
      {
        name: "Reactive dialogue",
        layer: "Narrative",
        what: "Conversations react to the character's background and to earlier choices.",
        why: "It makes the player feel recognized by the world.",
        effect: "Small details in a character's history change how others speak to them."
      },
      {
        name: "On-screen odds and previews",
        layer: "Presentation",
        what: "The interface shows hit chances, movement range and roll results before and after an action.",
        why: "It gives the player the information needed to take informed risks.",
        effect: "Failure feels like a gamble the player accepted, not a surprise."
      }
    ],

    feedback: {
      visual: [
        "Dice rolls and results are shown on screen.",
        "Movement range and hit chance are previewed before an action.",
        "Surfaces and effects change the look of the space."
      ],
      audio: [
        "Voiced dialogue gives characters personality.",
        "Music supports the tone of exploration and combat.",
        "Sound effects confirm hits, misses and spell effects."
      ],
      mechanical: [
        "Advantage and disadvantage change the odds of a roll.",
        "Reactions can interrupt a turn, which keeps the player involved on the enemy's turn.",
        "Companions react to choices through approval and comments."
      ]
    },

    onboarding: {
      summary:
        "The opening sequence introduces the basics through play, and pop-up tips appear when a rule is first needed. The player learns by doing, although the amount of systems is large and can feel heavy to new players.",
      steps: [
        "Character creation sets expectations about build and rules.",
        "A prologue introduces the first fights and checks.",
        "Tips appear when a mechanic is needed for the first time.",
        "More complex options open as the party grows."
      ],
      difficulty:
        "The game has several difficulty modes. They change the challenge of combat without changing the structure of the story, so players can choose how much tactical pressure they want."
    },

    pacing: {
      label: "Typical quest. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Explore and talk", v: 3, note: "Real-time movement and conversations." },
        { phase: "Tense conversation", v: 5, note: "A check or a decision with consequences." },
        { phase: "Combat", v: 7, note: "Turn-based fight with tactical depth." },
        { phase: "Loot and reflect", v: 2, note: "Collecting rewards and planning the next step." },
        { phase: "Big choice", v: 8, note: "A story decision that affects the world or the party." },
        { phase: "Boss", v: 9, note: "A major fight that uses the whole build." },
        { phase: "Camp", v: 2, note: "Rest and companion scenes." }
      ]
    },

    tensions: [
      {
        title: "Consequences against reloading",
        text: "Players can reload a save after a bad roll, which weakens the weight of the outcome. The design lets players choose how strict to be."
      },
      {
        title: "Freedom against content cost",
        text: "Every branch has to be written, voiced and tested, so freedom depends on a very large amount of authored content."
      },
      {
        title: "Depth against onboarding",
        text: "A large rule set gives tactical depth, but can overwhelm a player who is new to the genre."
      }
    ],

    takeaways: [
      {
        feeling: "Being recognized by the world",
        source: "Dialogue that reacts to context.",
        adaptation:
          "Let characters react to what is in the player's backpack, such as letters, photos or discs, so the objects the player has collected change what is said.",
        project: "ROADS",
        test: "Do players notice that the conversation changed because of what they carried?"
      },
      {
        feeling: "Informed risk",
        source: "Visible odds before an action.",
        adaptation:
          "In a negotiation game, show how likely an offer is to be accepted, so a refusal feels like a gamble the player took.",
        project: "The Haggler",
        test: "Do players take bigger risks when they see the odds?"
      },
      {
        feeling: "The space as a tool",
        source: "Surface and environment interaction.",
        adaptation:
          "Give environment objects a few clear rules, such as explosive or slippery, and apply them to enemies and the player in the same way.",
        project: "Counterpoint",
        test: "Do players use objects on purpose, or only when they happen to be nearby?"
      }
    ]
  },

  /* ===================================================================
     HADES
  =================================================================== */
  {
    slug: "hades",
    title: "Hades",
    studio: "Supergiant Games",
    year: "2020",
    genre: "Action roguelike",
    tags: ["Roguelike", "Narrative", "Melee combat"],
    hook: "Dying is how the story moves forward, so every failed run still pays out.",
    compare: {
      tension: "Fast real-time combat with limited healing across a run.",
      failure: "The run ends, but the story, relationships and permanent upgrades continue at home.",
      info: "Clear: rewards are shown on each door before the player chooses a room.",
      progression: "Permanent upgrades bought with resources kept between runs, plus new weapons and aspects.",
      feedback: "Hit flashes, character voice lines and the reward icons on doors.",
      onboarding: "The first runs are short and guided by characters, and systems unlock one at a time."
    },
    summary:
      "Hades is an action roguelike in which Zagreus tries to escape the underworld. Each run is a sequence of rooms with fights, and after each room the player picks the next door based on the reward it shows. Gods offer boons that change how attacks and abilities work, so every run builds a different set of powers. When Zagreus dies he returns home, where characters react to what happened, the story advances and resources can be spent on permanent upgrades.",
    fantasy:
      "Being a stubborn hero who gets a little stronger, and a little closer to his family, every time he fails.",
    facts: [
      { k: "Perspective", v: "Isometric" },
      { k: "Structure", v: "Runs through four regions, with a hub between runs" },
      { k: "Combat", v: "Real-time, with attack, special, cast and dash" },
      { k: "Failure cost", v: "The run ends, permanent progress is kept" }
    ],

    coreLoop: {
      note:
        "There are two loops. The run loop repeats room by room until death or escape, and the home loop turns every ending into story and upgrades before the next attempt.",
      steps: [
        { label: "Clear a room", detail: "The player fights a wave of enemies in a closed room.", feeling: "Fast focus and constant movement." },
        { label: "Take the reward", detail: "A boon, a resource or an upgrade appears when the room is cleared.", feeling: "A small payoff for every fight." },
        { label: "Choose a door", detail: "Each exit shows the reward of the next room, so the player plans the build.", feeling: "Ownership over where the run is going." },
        { label: "Build the run", detail: "Boons from different gods combine, and some unlock stronger duo effects.", feeling: "Excitement when a combination clicks." },
        { label: "Die or escape", detail: "The run ends at a boss, a hard room or the surface.", feeling: "Disappointment softened by curiosity about home." },
        { label: "Return home", detail: "Characters comment on the run, gifts deepen relationships and resources buy permanent upgrades.", feeling: "Warmth and a reason to try again." }
      ]
    },

    systems: [
      { name: "Dash", layer: "Mechanic", what: "A short, fast dodge that briefly avoids damage and can be chained.", why: "It keeps combat mobile and gives the player a reliable answer to most threats.", effect: "Movement becomes the main defensive skill instead of blocking." },
      { name: "Weapon aspects", layer: "Mechanic", what: "Each of the six weapons has alternative forms that change how its attacks behave.", why: "It adds variety without adding new controls.", effect: "Players return to a known weapon to learn a new way of using it." },
      { name: "Boons", layer: "System", what: "Gods offer a choice of upgrades that attach to attack, special, cast, dash or passive effects.", why: "It makes each run a different build from the same base kit.", effect: "The player adapts their play to the powers they are offered." },
      { name: "Door rewards", layer: "System", what: "Before entering a room, the player sees which reward type it will give.", why: "It turns the route through a region into a planning decision.", effect: "Players feel responsible for the build they end up with." },
      { name: "Permanent upgrades", layer: "System", what: "Resources collected in runs are spent at home on lasting bonuses, such as extra lives or more damage.", why: "It guarantees progress even after a failed run.", effect: "Failure feels like an investment rather than a loss." },
      { name: "Heat", layer: "System", what: "After a first escape, the player can add chosen difficulty conditions to earn more rewards.", why: "It lets experienced players tune the challenge they want.", effect: "Late-game runs stay tense without a fixed difficulty jump." },
      { name: "God Mode", layer: "System", what: "An optional mode that gives damage resistance, growing a little after each death.", why: "It lets more players reach the end of the story.", effect: "Players who struggle can keep going without the game changing its rules." },
      { name: "Story told through death", layer: "Narrative", what: "New conversations unlock between runs based on what just happened, including who killed the player.", why: "It ties the repeat structure to the story.", effect: "Players look forward to returning home, even after losing." },
      { name: "Region bosses", layer: "Content", what: "Each region ends with a boss that changes its patterns on later encounters.", why: "They mark progress and test the build so far.", effect: "Reaching a new boss is a clear milestone." },
      { name: "Readable combat effects", layer: "Presentation", what: "Enemy attacks show ground markers and flashes, and each god has a color for its effects.", why: "It keeps fast combat readable even with many effects on screen.", effect: "The player can react to threats inside busy fights." }
    ],

    feedback: {
      visual: [
        "Ground markers show where enemy attacks will land.",
        "Each god's boons have a distinct color and icon.",
        "Reward icons above doors show what each room offers."
      ],
      audio: [
        "Characters comment on events during runs and at home.",
        "Strong hits and kills have punchy, layered sounds.",
        "Music changes in intensity during boss fights."
      ],
      mechanical: [
        "Hits slow the action very briefly, which makes impact readable.",
        "Taking damage interrupts the player's attack.",
        "Running out of extra lives ends the run immediately."
      ]
    },

    onboarding: {
      summary:
        "The first runs are short and characters explain each system the first time it appears. New resources, weapons and options unlock gradually, so the full set of systems arrives over many runs instead of in a single tutorial.",
      steps: [
        "A first run with a single weapon and simple rooms.",
        "Boons explained by the gods when they first appear.",
        "Home systems unlocked after the first deaths.",
        "New weapons, upgrades and Heat added over later runs."
      ],
      difficulty:
        "The base challenge rises across regions and bosses. God Mode lowers it on request, and Heat raises it with conditions the player chooses."
    },

    pacing: {
      label: "One run through a region. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Leave home", v: 1, note: "Calm, with a last choice of weapon and gear." },
        { phase: "First rooms", v: 4, note: "Quick fights that start the build." },
        { phase: "Build forms", v: 6, note: "The player starts planning around the boons received." },
        { phase: "Elite room", v: 7, note: "Harder enemies test the build early." },
        { phase: "Shop and rest", v: 3, note: "A pause to heal and buy before the boss." },
        { phase: "Boss", v: 9, note: "The highest pressure of the region." },
        { phase: "Next region", v: 5, note: "Relief, then new enemies and new rewards." }
      ]
    },

    tensions: [
      { title: "Repetition against novelty", text: "Runs repeat the same regions, so the game depends on boons, dialogue and unlocks to keep each attempt feeling new." },
      { title: "Permanent power against skill", text: "Upgrades make later runs easier, which helps progress but can blur whether the player actually improved." },
      { title: "Choice against randomness", text: "Door rewards give control, but the boons inside are still random, so some runs never come together." }
    ],

    takeaways: [
      { feeling: "Failure that still pays", source: "Story told through death and permanent upgrades.", adaptation: "In a game with retries, give every attempt something to carry back, such as a line of dialogue, a resource or a piece of the map.", project: "", test: "After a loss, do players start the next attempt right away, or stop playing?" },
      { feeling: "Choosing the next reward", source: "Door rewards.", adaptation: "Show what each path gives before the player commits, so routing becomes a decision instead of a guess.", project: "", test: "Can players explain why they chose a path?" },
      { feeling: "Difficulty without shame", source: "God Mode.", adaptation: "Offer an assist that grows slowly and is framed as part of the world, so using it does not feel like giving up.", project: "", test: "Do players who switch it on keep playing to the end?" }
    ]
  },

  /* ===================================================================
     CELESTE
  =================================================================== */
  {
    slug: "celeste",
    title: "Celeste",
    studio: "Maddy Makes Games",
    year: "2018",
    genre: "Precision platformer",
    tags: ["Platforming", "Difficulty", "Narrative"],
    hook: "Death costs a second, so hard challenges feel like practice instead of punishment.",
    compare: {
      tension: "Precise movement on single-screen challenges.",
      failure: "Instant respawn at the start of the current screen.",
      info: "Everything is visible: each screen shows the whole challenge before the player moves.",
      progression: "New chapters with new mechanics, and optional collectibles for extra challenge.",
      feedback: "Hair color for the dash, screen shake and the death counter.",
      onboarding: "Each chapter introduces one mechanic in safe screens before combining it."
    },
    summary:
      "Celeste is a precision platformer about Madeline climbing a mountain. Movement is built on a small set of actions: run, jump, climb and an air dash that recharges on landing. Each screen is a short challenge, and death sends the player back to its start almost instantly. The story about anxiety and self-doubt runs alongside the difficulty, so the act of failing and trying again matches what the character is going through.",
    fantasy:
      "Overcoming something that feels impossible, one small step at a time.",
    facts: [
      { k: "Perspective", v: "2D side view" },
      { k: "Structure", v: "Chapters made of single-screen challenges" },
      { k: "Moves", v: "Jump, climb and one air dash" },
      { k: "Failure cost", v: "Restart the current screen" }
    ],

    coreLoop: {
      note:
        "The loop is very short: a screen can be attempted dozens of times in a minute. Each chapter adds one mechanic, so the loop stays the same while what the player has to read changes.",
      steps: [
        { label: "Read the screen", detail: "The player looks at the whole room and plans a route.", feeling: "Curiosity and a little doubt." },
        { label: "Attempt", detail: "The player executes the route with jumps, climbs and dashes.", feeling: "Full concentration." },
        { label: "Die and respawn", detail: "A mistake sends the player back to the start of the screen in about a second.", feeling: "Brief frustration, then readiness." },
        { label: "Refine", detail: "The player fixes the part that failed and tries again.", feeling: "A sense of getting closer." },
        { label: "Clear", detail: "Reaching the exit moves the player to the next screen.", feeling: "Relief and pride." }
      ]
    },

    systems: [
      { name: "Air dash", layer: "Mechanic", what: "One dash in any of eight directions, recharged on landing or by touching crystals.", why: "It gives a precise tool with a clear limit.", effect: "Each screen becomes a puzzle about when to spend the dash." },
      { name: "Climbing with stamina", layer: "Mechanic", what: "Madeline can grab walls and climb until a short stamina limit runs out.", why: "It adds vertical routes with a time limit.", effect: "Players learn to rest on ledges and plan climbs." },
      { name: "Forgiving controls", layer: "Mechanic", what: "Jumps still work shortly after leaving a ledge, and inputs pressed slightly early still count.", why: "It makes the controls match the player's intention.", effect: "Hard screens feel strict but fair." },
      { name: "Instant respawn", layer: "System", what: "Death restarts the current screen in about a second, with no lives or lost progress.", why: "It removes the cost of trying.", effect: "Players experiment and attempt very hard sections many times." },
      { name: "Strawberries", layer: "System", what: "Optional collectibles placed on harder side routes. The game says they do not unlock anything.", why: "They give skilled players extra challenge without blocking others.", effect: "Players choose their own difficulty inside each screen." },
      { name: "Assist Mode", layer: "System", what: "Options to slow the game, add dashes, or make the player invincible.", why: "It lets everyone reach the end of the story.", effect: "Players can tune difficulty without the game judging them." },
      { name: "One mechanic per chapter", layer: "Content", what: "Each chapter is built around a new element, such as moving blocks, wind or bubbles.", why: "It keeps the basic moves fresh across the game.", effect: "The player relearns familiar moves in new situations." },
      { name: "B-side chapters", layer: "Content", what: "Harder remixes of each chapter, unlocked by finding a hidden cassette.", why: "They extend the game for players who want mastery.", effect: "Experts get a second game made of the same ideas." },
      { name: "Story about anxiety", layer: "Narrative", what: "Madeline's struggle with self-doubt is told through short scenes between climbs.", why: "It gives the difficulty an emotional meaning.", effect: "Pushing through a hard section feels connected to the story." },
      { name: "Hair as dash indicator", layer: "Presentation", what: "Madeline's hair changes color when the dash is used.", why: "It shows a key resource on the character, where the player is already looking.", effect: "Players always know whether they can dash." }
    ],

    feedback: {
      visual: [
        "Hair color shows whether the dash is available.",
        "Small screen shake and particles mark a dash.",
        "A death counter is shown at the end of each chapter."
      ],
      audio: [
        "Distinct sounds for jump, dash and landing.",
        "Music builds over chapters and shifts with key story moments.",
        "Collectibles play a short tune when picked up."
      ],
      mechanical: [
        "Touching hazards kills instantly and restarts the screen.",
        "Running out of stamina makes Madeline slide off walls.",
        "Landing recharges the dash right away."
      ]
    },

    onboarding: {
      summary:
        "The prologue teaches jumping and climbing, then introduces the dash in a dramatic moment. After that, each chapter teaches its new element in safe screens before mixing it with earlier ones. Text tutorials are rare: the level layout does most of the teaching.",
      steps: [
        "A prologue that teaches running, jumping and climbing.",
        "The dash introduced in a single scripted moment.",
        "Each new mechanic shown first where failure is cheap.",
        "Later screens combine mechanics from earlier chapters."
      ],
      difficulty:
        "The main path is hard but forgiving. Strawberries and B-sides add optional challenge, and Assist Mode lowers it."
    },

    pacing: {
      label: "One chapter. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "New mechanic", v: 3, note: "Safe screens that show what the new element does." },
        { phase: "Practice", v: 5, note: "Short challenges that combine it with the dash." },
        { phase: "Checkpoint", v: 2, note: "A quiet screen, sometimes with a story moment." },
        { phase: "Hard sequence", v: 8, note: "Longer screens that demand precision." },
        { phase: "Story scene", v: 3, note: "Dialogue that gives the struggle a meaning." },
        { phase: "Final climb", v: 9, note: "The hardest screens of the chapter, often with music building up." },
        { phase: "Summit", v: 2, note: "Release, with the death count as a record of effort." }
      ]
    },

    tensions: [
      { title: "Hard but kind", text: "The game is demanding, but instant respawn and Assist Mode remove most of the punishment around that difficulty." },
      { title: "Optional challenge against completion", text: "Strawberries are said to be meaningless, which frees players from completionism, yet many still feel they have to collect them." },
      { title: "Story against flow", text: "Story scenes give meaning to the climb, but they also interrupt a rhythm that players may want to keep." }
    ],

    takeaways: [
      { feeling: "Failure that costs almost nothing", source: "Instant respawn.", adaptation: "In a skill-based section, cut the time between failing and trying again to the minimum, and keep the player close to the mistake.", project: "", test: "How many attempts do players make before they stop, with and without the shorter restart?" },
      { feeling: "Difficulty the player chooses", source: "Strawberries on side routes.", adaptation: "Place optional rewards on harder lines through the same space, so experts and beginners share the level.", project: "", test: "Do players attempt the optional route, and do they come back to it later?" },
      { feeling: "A resource the player can see", source: "Hair as dash indicator.", adaptation: "Show the most important resource on the character instead of in the corner of the screen.", project: "", test: "Can players say whether the resource is available without looking away from the action?" }
    ]
  },

  /* ===================================================================
     SLAY THE SPIRE
  =================================================================== */
  {
    slug: "slay-the-spire",
    title: "Slay the Spire",
    studio: "Mega Crit Games",
    year: "2019",
    genre: "Roguelike deckbuilder",
    tags: ["Roguelike", "Turn-based", "Deckbuilding"],
    hook: "The enemy says what it will do next, so every turn is a puzzle instead of a guess.",
    compare: {
      tension: "Limited energy each turn against what the enemies have announced.",
      failure: "The run ends and starts over, with new cards unlocked for later runs.",
      info: "Very open: enemies show their next action, and the map shows every path ahead.",
      progression: "Within a run, cards, relics and upgrades. Between runs, unlocks and higher Ascension levels.",
      feedback: "Intent icons, damage numbers and the deck itself.",
      onboarding: "A first character with simple cards, and enemy intents explained by their icons."
    },
    summary:
      "Slay the Spire is a roguelike deckbuilder. The player climbs a tower of three acts, choosing a path through a map of fights, events, shops and rest sites. Combat is turn-based: each turn the player draws cards and spends a small amount of energy to attack and defend. Enemies show what they will do next, so the player plans each turn around known threats. After fights the player picks one of three new cards, which slowly shapes a deck built for that run.",
    fantasy:
      "Being a clever strategist who builds a winning machine from a few small choices.",
    facts: [
      { k: "Perspective", v: "2D side view with cards" },
      { k: "Structure", v: "Three acts on a branching map" },
      { k: "Combat", v: "Turn-based, with cards and energy" },
      { k: "Failure cost", v: "The run ends" }
    ],

    coreLoop: {
      note:
        "Inside a fight the loop is draw, plan and play. Across the run it is choose a path, fight, and add or remove cards. The two loops feed each other: the deck decides how fights go, and fights decide the deck.",
      steps: [
        { label: "Choose a path", detail: "The player picks the next room on a map of fights, elites, events, shops and rest sites.", feeling: "Planning ahead with known risks." },
        { label: "Read intents", detail: "Each enemy shows an icon for its next action, such as an attack and its damage.", feeling: "Clarity about the threat." },
        { label: "Play the hand", detail: "The player spends energy on cards to block, attack and set up.", feeling: "Puzzle-solving under limits." },
        { label: "Win the fight", detail: "Defeating the enemies gives gold, sometimes a potion or relic, and a card choice.", feeling: "Satisfaction and anticipation." },
        { label: "Shape the deck", detail: "The player adds one of three cards, skips them, or later removes and upgrades cards.", feeling: "Ownership over the strategy." }
      ]
    },

    systems: [
      { name: "Energy and hand", layer: "Mechanic", what: "Each turn the player draws five cards and has three energy to play them.", why: "It creates a small, clear budget for every turn.", effect: "Every turn asks what matters most right now." },
      { name: "Block that resets", layer: "Mechanic", what: "Defense gained with block cards disappears at the start of the next turn.", why: "It forces the player to defend every turn instead of stockpiling.", effect: "Attack and defense compete for the same energy." },
      { name: "Enemy intents", layer: "System", what: "Icons above enemies show whether they will attack, defend, buff or debuff, and how much damage is coming.", why: "It turns combat into planning rather than guessing.", effect: "Players feel that losses come from their decisions." },
      { name: "Card rewards", layer: "System", what: "After a fight the player picks one of three cards or skips.", why: "It makes the deck grow through many small choices.", effect: "Skipping becomes a real choice, because a smaller deck is more reliable." },
      { name: "Relics", layer: "System", what: "Permanent items for the run that change rules, such as extra energy or bonus effects.", why: "They create run-defining combinations.", effect: "Players adapt their strategy around the relics they find." },
      { name: "Branching map", layer: "Content", what: "Each act is a map where the player chooses a route through fights, elites, events, shops and rest sites.", why: "It lets players balance risk against reward.", effect: "Routing is planned around the current deck and health." },
      { name: "Rest site choice", layer: "System", what: "At a rest site the player either heals or upgrades a card.", why: "It forces a trade between safety now and strength later.", effect: "Healthy players push their deck, hurt players play safe." },
      { name: "Ascension", layer: "System", what: "After a win, the player can climb Ascension levels that add one harder rule each.", why: "It extends the challenge for experts.", effect: "The same game stays tense after many wins." },
      { name: "Four characters", layer: "Content", what: "Each character has its own card pool and mechanics.", why: "It gives several different games with one structure.", effect: "Players learn new strategies without learning new rules." },
      { name: "Readable card text", layer: "Presentation", what: "Cards use short text, keywords and numbers that update with buffs and debuffs.", why: "It keeps complex combinations understandable.", effect: "Players can calculate their turn exactly." }
    ],

    feedback: {
      visual: [
        "Intent icons above enemies show the next action and damage.",
        "Card numbers change color when modified by buffs or debuffs.",
        "The map shows every room type on every path."
      ],
      audio: [
        "Each card type has a distinct sound when played.",
        "Heavy hits and blocks sound different.",
        "Boss fights have their own music."
      ],
      mechanical: [
        "Unblocked damage reduces health, which carries between fights.",
        "Status cards added by enemies clog the deck.",
        "Running out of energy ends what the player can do that turn."
      ]
    },

    onboarding: {
      summary:
        "The game starts with a single character and a simple deck. Enemy intents and card keywords explain themselves through icons and tooltips. More characters and cards unlock as the player completes runs, so complexity grows with experience.",
      steps: [
        "One character with simple attack and defend cards.",
        "Intents and keywords explained with tooltips.",
        "Early floors with weaker enemies to learn the rules.",
        "New characters and cards unlocked over later runs."
      ],
      difficulty:
        "Challenge rises through the three acts and their bosses. After a win, Ascension levels raise it one rule at a time."
    },

    pacing: {
      label: "One act. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "First fights", v: 3, note: "Easy enemies while the deck is weak." },
        { phase: "Event", v: 2, note: "A choice with a risk, outside combat." },
        { phase: "Elite", v: 7, note: "A hard fight for a relic." },
        { phase: "Rest site", v: 2, note: "Heal or upgrade before the end of the act." },
        { phase: "Shop", v: 3, note: "Buy cards or remove weak ones." },
        { phase: "Boss", v: 9, note: "The test of the whole deck." },
        { phase: "Boss relic", v: 5, note: "A strong reward that can change the strategy." }
      ]
    },

    tensions: [
      { title: "Information against surprise", text: "Showing intents removes guessing, but it also makes some fights feel solved once the player knows the pattern." },
      { title: "Choice against luck", text: "Players choose every card, but the order of draws and rewards is random, so even good decisions can lose." },
      { title: "Small deck against strong cards", text: "Skipping rewards keeps the deck reliable, but new players often add every card and do not understand why the deck gets worse." }
    ],

    takeaways: [
      { feeling: "Losses that feel like my fault", source: "Enemy intents.", adaptation: "Show what enemies will do next turn, so the player plans instead of reacting to surprises.", project: "", test: "After a loss, can players name the turn where they made the mistake?" },
      { feeling: "Small decisions that add up", source: "Card rewards with a skip option.", adaptation: "After each encounter, offer a short choice that includes taking nothing.", project: "", test: "Do players ever skip, and can they explain why?" },
      { feeling: "Risk the player chooses", source: "The branching map.", adaptation: "Show room types ahead of time, so players choose how much danger to accept.", project: "", test: "Do players route differently when their health is low?" }
    ]
  },

  /* ===================================================================
     HOLLOW KNIGHT
  =================================================================== */
  {
    slug: "hollow-knight",
    title: "Hollow Knight",
    studio: "Team Cherry",
    year: "2017",
    genre: "Metroidvania",
    tags: ["Exploration", "Level design", "Melee combat"],
    hook: "The map is something the player has to earn, so getting lost becomes part of exploring.",
    compare: {
      tension: "Exploring unknown areas while carrying currency that can be lost.",
      failure: "Currency is left with a shade at the place of death, and must be recovered by defeating it.",
      info: "Partial: maps must be bought and only update at benches.",
      progression: "Movement abilities that open new paths, plus charms, health and nail upgrades.",
      feedback: "Soul gauge, hit sparks and the map filling in.",
      onboarding: "A short opening path, then a large world with few explanations."
    },
    summary:
      "Hollow Knight is a metroidvania set in Hallownest, a ruined underground kingdom. The player explores a large interconnected world, finding movement abilities that open paths that were blocked before. Combat is close-range with a nail, and healing uses Soul gained by hitting enemies. Maps are not given by default: they are bought from a cartographer and only update at benches, so finding your way is part of the challenge.",
    fantasy:
      "Being a small wanderer who learns a vast, forgotten world by getting lost in it.",
    facts: [
      { k: "Perspective", v: "2D side view" },
      { k: "Structure", v: "Large interconnected world with ability gates" },
      { k: "Combat", v: "Melee with a nail, plus spells" },
      { k: "Failure cost", v: "Currency left at the place of death" }
    ],

    coreLoop: {
      note:
        "Exploration feeds the loop: a new ability changes how old areas can be crossed, so the player keeps returning to places with new tools.",
      steps: [
        { label: "Explore", detail: "The player enters an unknown area without a full map.", feeling: "Curiosity mixed with being lost." },
        { label: "Fight", detail: "Enemies give Geo and Soul, and hits must be timed around their attacks.", feeling: "Focus and danger." },
        { label: "Find something", detail: "A map, a charm, an ability or a shortcut rewards the search.", feeling: "Discovery." },
        { label: "Rest at a bench", detail: "Benches save progress, update the map and allow changing charms.", feeling: "Relief and a moment to plan." },
        { label: "Return stronger", detail: "New abilities open paths in areas already visited.", feeling: "The world opening up." }
      ]
    },

    systems: [
      { name: "Nail combat", layer: "Mechanic", what: "Short-range slashes in four directions, including a downward strike that bounces on enemies and hazards.", why: "It keeps combat simple and tied to movement.", effect: "Players learn spacing and timing for each enemy." },
      { name: "Soul and focus", layer: "System", what: "Hitting enemies fills a Soul gauge, which is spent to heal or cast spells. Healing takes time to channel.", why: "It ties healing to aggression and makes healing a risk.", effect: "Players must create safe moments in fights to heal." },
      { name: "Charms and notches", layer: "System", what: "Charms give effects, but the player can only equip as many as their notches allow, and only at benches.", why: "It turns builds into choices with limits.", effect: "Players adjust their loadout to an area or a boss." },
      { name: "Shade and lost Geo", layer: "System", what: "On death the player loses their Geo and leaves a shade where they died. Defeating it returns the Geo.", why: "It adds stakes to carrying currency.", effect: "Players spend Geo before risky areas and return carefully after dying." },
      { name: "Maps that must be earned", layer: "System", what: "Each area's map is bought from a cartographer, and the map only updates when resting at a bench.", why: "It makes navigation part of exploration.", effect: "Getting lost and finding the cartographer becomes a small goal." },
      { name: "Ability gates", layer: "Content", what: "Paths are blocked until the player finds abilities such as a dash, a wall climb or a double jump.", why: "It structures a large world without locked doors.", effect: "Players remember blocked paths and return when they can pass." },
      { name: "Benches", layer: "System", what: "Benches are save points, healing points and the only place to change charms.", why: "They create safe points in a hostile world.", effect: "Finding a bench in a new area is a moment of relief." },
      { name: "Boss fights", layer: "Content", what: "Bosses with readable patterns test movement and combat together.", why: "They act as checkpoints for mastery.", effect: "Victory comes from learning patterns, not only from upgrades." },
      { name: "Environmental storytelling", layer: "Narrative", what: "The kingdom's history is told through ruins, characters and short lore tablets.", why: "It rewards curiosity without long scenes.", effect: "Players piece the story together at their own pace." },
      { name: "Hand-drawn readable art", layer: "Presentation", what: "Characters and enemies use clear silhouettes against layered backgrounds.", why: "It keeps threats readable in dark, detailed spaces.", effect: "The player can read enemy attacks even in busy rooms." }
    ],

    feedback: {
      visual: [
        "The Soul gauge fills as the player hits enemies.",
        "Hit sparks and a brief pause mark every strike.",
        "The map fills in at benches, showing progress."
      ],
      audio: [
        "Distinct sounds for hits, damage and healing.",
        "Each area has its own music and ambient sounds.",
        "Boss fights start with a title and a change in music."
      ],
      mechanical: [
        "Taking damage knocks the player back and gives brief invulnerability.",
        "Downward strikes bounce off enemies and hazards.",
        "Healing is interrupted if the player is hit while channeling."
      ]
    },

    onboarding: {
      summary:
        "The opening is a short, guided path that teaches movement, striking and healing. After the first town, the world opens and the game explains very little. Players learn by exploring, dying and noticing what is blocked.",
      steps: [
        "A linear opening that teaches movement and combat.",
        "A town that works as a hub with shops and characters.",
        "The cartographer introduced near the start of new areas.",
        "Abilities that reveal paths the player already saw."
      ],
      difficulty:
        "There is no difficulty setting. Challenge comes from enemies, bosses and navigation, and the player eases it with charms, upgrades and exploring other areas first."
    },

    pacing: {
      label: "Exploring a new area. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Enter area", v: 4, note: "No map, new enemies and unknown paths." },
        { phase: "Lost", v: 6, note: "Searching for the cartographer or a bench." },
        { phase: "Map found", v: 3, note: "Orientation returns and the area makes sense." },
        { phase: "Bench", v: 2, note: "Safety, saving and a change of charms." },
        { phase: "Hard path", v: 7, note: "Platforming and fights deeper in the area." },
        { phase: "Boss", v: 10, note: "A pattern test at the end of the area." },
        { phase: "New ability", v: 3, note: "Release, and old paths become reachable." }
      ]
    },

    tensions: [
      { title: "Getting lost against frustration", text: "Earning the map makes exploration meaningful, but players without a map can wander for a long time without progress." },
      { title: "Freedom against direction", text: "The open world gives many routes, but it also lets players reach areas that are too hard for them." },
      { title: "Corpse run against tedium", text: "Recovering the shade adds stakes, but a long walk back to a hard boss can make the penalty feel repetitive." }
    ],

    takeaways: [
      { feeling: "Navigation as discovery", source: "Maps that must be earned.", adaptation: "Make the map something the player builds or earns, so knowing the space becomes a reward.", project: "", test: "Do players remember the layout of an area without opening the map?" },
      { feeling: "Healing as a risk", source: "Soul and focus.", adaptation: "Tie healing to a resource gained by acting, and make healing take time, so the player has to create safe moments.", project: "", test: "Do players heal in the middle of fights, or wait until they are safe?" },
      { feeling: "Remembering locked paths", source: "Ability gates.", adaptation: "Show blocked paths clearly early, and make the ability that opens them recognizable.", project: "", test: "When players get a new ability, do they think of a place to use it?" }
    ]
  },

  /* ===================================================================
     INTO THE BREACH
  =================================================================== */
  {
    slug: "into-the-breach",
    title: "Into the Breach",
    studio: "Subset Games",
    year: "2018",
    genre: "Turn-based tactics",
    tags: ["Turn-based", "Tactics", "Roguelike"],
    hook: "Enemies announce every attack, so the puzzle is not surviving but protecting.",
    compare: {
      tension: "Protecting buildings and the power grid from attacks that have already been announced.",
      failure: "If the grid reaches zero the timeline is lost, and one pilot can be sent to a new attempt.",
      info: "Complete: every enemy attack and its target are shown before the player acts.",
      progression: "Within a run, upgrades and pilots. Between runs, new squads and achievements.",
      feedback: "Attack previews, the grid meter and building damage.",
      onboarding: "A tutorial battle, then small 8 by 8 maps with few units."
    },
    summary:
      "Into the Breach is a turn-based tactics game played on small 8 by 8 maps. The player controls three mechs defending cities from giant insects called the Vek. Before the player moves, every enemy shows exactly what it will attack. The goal is not only to kill enemies, but to stop their attacks by pushing them, blocking them or making them hit each other. Damage to buildings reduces a shared power grid, and if the grid fails the run is lost.",
    fantasy:
      "Being the commander who saves everyone with a perfect, clever move.",
    facts: [
      { k: "Perspective", v: "Isometric grid" },
      { k: "Structure", v: "Islands of short battles, then a final mission" },
      { k: "Combat", v: "Turn-based, three mechs on an 8 by 8 map" },
      { k: "Failure cost", v: "The run ends when the power grid fails" }
    ],

    coreLoop: {
      note:
        "Each battle lasts only a few turns, and each turn is a complete puzzle: the board, the threats and the tools are all on screen.",
      steps: [
        { label: "Read the threats", detail: "Every enemy shows its target and the damage it will do.", feeling: "Clarity and urgency." },
        { label: "Plan", detail: "The player looks for moves that push, block or redirect attacks.", feeling: "Puzzle-solving." },
        { label: "Act", detail: "Each mech moves and attacks once, and the board changes after each action.", feeling: "Commitment." },
        { label: "Resolve", detail: "Enemies attack in order, and spawns emerge where they were marked.", feeling: "Tension, then relief or regret." },
        { label: "Upgrade", detail: "After an island, reputation buys power, weapons and grid repairs.", feeling: "Preparation for harder fights." }
      ]
    },

    systems: [
      { name: "Push and displacement", layer: "Mechanic", what: "Many weapons move enemies by one tile instead of only damaging them.", why: "It turns positioning into the main weapon.", effect: "Players solve threats by moving enemies into each other or into hazards." },
      { name: "Telegraphed attacks", layer: "System", what: "Enemy attacks and their exact targets are shown before the player moves.", why: "It removes hidden information from each turn.", effect: "Every loss feels like a solvable mistake." },
      { name: "Power grid", layer: "System", what: "Buildings damaged in battle reduce a shared grid. If it reaches zero, the run is lost.", why: "It makes protecting the map more important than killing enemies.", effect: "Players sometimes take damage on their mechs to save a building." },
      { name: "Turn order", layer: "System", what: "Enemies act in a fixed order that the player can inspect.", why: "It adds depth to how attacks interact.", effect: "Players use the order to make enemies hit each other." },
      { name: "Mission objectives", layer: "Content", what: "Battles include extra goals, such as protecting a specific structure or killing a number of enemies.", why: "They vary what success means in each map.", effect: "The player weighs bonus rewards against safety." },
      { name: "Squads and pilots", layer: "Content", what: "Squads of three mechs have different weapons, and pilots give small abilities.", why: "They create different puzzles from the same rules.", effect: "Players learn new ways to read the board with each squad." },
      { name: "Turn reset", layer: "System", what: "Once per battle, the player can undo their whole turn.", why: "It forgives a single misread without removing the challenge.", effect: "Players experiment more, but use the reset carefully." },
      { name: "Time travel framing", layer: "Narrative", what: "The pilots come from a failed future, and a lost run sends one pilot back to a new timeline.", why: "It explains restarts inside the story.", effect: "Failure feels like part of the fiction." },
      { name: "Clean board readability", layer: "Presentation", what: "Small maps, clear tile colors and arrows show every threat and every result.", why: "It keeps a complex puzzle readable at a glance.", effect: "Players can calculate the outcome of a move before making it." }
    ],

    feedback: {
      visual: [
        "Red tiles and arrows show where each enemy will attack.",
        "Previews show the result of an action before it is confirmed.",
        "The grid meter drops when a building is hit."
      ],
      audio: [
        "Heavy impacts mark pushes and collisions.",
        "Building damage has a distinct alarm-like sound.",
        "Pilots comment on events in short text lines."
      ],
      mechanical: [
        "Pushing an enemy into another damages both.",
        "Damaged buildings stay damaged for the rest of the battle.",
        "Mechs disabled in battle lose their pilot's experience if the pilot dies."
      ]
    },

    onboarding: {
      summary:
        "A tutorial battle explains movement, attacks and telegraphs. After that, the small maps and few units keep the rules manageable. The preview of every action means players can learn by trying moves before committing.",
      steps: [
        "A tutorial battle with step-by-step prompts.",
        "Islands chosen in any order, each with a few battles.",
        "Action previews that show results before confirming.",
        "New squads unlocked by completing achievements."
      ],
      difficulty:
        "Difficulty can be chosen at the start of a run, and the order of islands changes how hard the run becomes."
    },

    pacing: {
      label: "One island. This is my own reading of the rhythm, not measured data.",
      points: [
        { phase: "Choose a battle", v: 2, note: "A calm choice between objectives and rewards." },
        { phase: "Deployment", v: 4, note: "The board and the first threats appear." },
        { phase: "Middle turns", v: 7, note: "Several attacks to stop at once." },
        { phase: "Last turn", v: 8, note: "Survive one more round with damaged mechs." },
        { phase: "Rewards", v: 3, note: "Reputation, power or pilots." },
        { phase: "Island boss", v: 9, note: "A harder battle with a large enemy." },
        { phase: "Shop", v: 2, note: "Spend rewards before the next island." }
      ]
    },

    tensions: [
      { title: "Perfect information against luck", text: "Showing every attack makes turns feel solvable, but spawns and grid defense chances still add some randomness." },
      { title: "Short battles against depth", text: "Small maps keep battles quick, but leave little room to recover from one bad turn." },
      { title: "Protect against attack", text: "Valuing buildings over kills is the core idea, but players used to other tactics games may not see it at first." }
    ],

    takeaways: [
      { feeling: "Puzzle-like turns", source: "Telegraphed attacks.", adaptation: "Show enemy intentions exactly, so each turn becomes a puzzle the player can solve.", project: "", test: "Do players spend time planning, or act right away?" },
      { feeling: "Protecting something", source: "The power grid.", adaptation: "Give the player something fragile to protect that matters more than their own health.", project: "", test: "Do players accept damage to protect it?" },
      { feeling: "Movement as a weapon", source: "Push and displacement.", adaptation: "Let some attacks move enemies instead of damaging them, so positioning becomes the main skill.", project: "", test: "Do players use pushes to make enemies hit each other?" }
    ]
  }
];
