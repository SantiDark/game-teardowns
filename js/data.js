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
    "Independent design analysis. All diagrams are original and no game assets are used. Game titles belong to their respective owners.",

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
  }
];
