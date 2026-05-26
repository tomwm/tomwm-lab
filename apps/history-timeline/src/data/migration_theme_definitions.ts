// src/data/migration_theme_definitions.ts

export interface ThemeDefinition {
  id: string;
  title: string;
  summary: string;
  keyIdeas: string[];
  relatedCardIds: string[];
}

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: "survival",
    title: "Survival",
    summary:
      "Migration often happens when staying at home is no longer possible because of famine, overcrowding, environmental disaster, invasion or poverty.",
    keyIdeas: [
      "Push factors can force people to leave even when migration is risky.",
      "Scandinavian overcrowding and lack of fertile land helped drive Viking movement.",
      "The Great Famine in Ireland killed around one million people and forced over a million more to emigrate.",
      "Survival migration often overlaps with economic migration, war and displacement."
    ],
    relatedCardIds: [
      "danish-invasions",
      "irish-migration-and-home-rule",
      "highland-clearances",
      "jewish-migration",
      "migration-to-and-from-canada",
      "migration-to-new-zealand",
      "windrush-caribbean-migration",
      "ugandan-asian-immigration"
    ]
  },
  {
    id: "empire",
    title: "Empire",
    summary:
      "Empire created large networks through which people, goods, capital and ideas moved, often under unequal political power.",
    keyIdeas: [
      "An empire is a group of countries or territories ruled by a single supreme authority.",
      "The East India Company’s expansion drew millions of Indian people into imperial systems.",
      "Indian indentured servants later migrated to Africa and the Caribbean to work on railways and plantations.",
      "The Scramble for Africa enabled European powers to claim nearly 90% of the continent by 1900.",
      "Empire encouraged British settlement in areas such as Rhodesia and South Africa."
    ],
    relatedCardIds: [
      "east-india-company",
      "robert-clive",
      "battle-of-plassey",
      "treaty-of-allahabad",
      "british-raj",
      "indian-indentured-servants",
      "scramble-for-africa",
      "cecil-john-rhodes",
      "matabeleland",
      "rhodesia",
      "suez-canal",
      "windrush-caribbean-migration",
      "australia-convict-transportation"
    ]
  },
  {
    id: "war",
    title: "War",
    summary:
      "War can force people to move as refugees, soldiers, settlers or displaced communities, and can redirect imperial priorities after victory or defeat.",
    keyIdeas: [
      "Conflict creates refugee movement and military migration.",
      "The First and Second World Wars brought colonial soldiers to Britain and encouraged some to settle afterwards.",
      "The loss of the American colonies pushed Britain to seek new imperial outlets, including Australia as a penal colony.",
      "Wars often weaken empires and accelerate independence movements."
    ],
    relatedCardIds: [
      "danish-invasions",
      "battle-of-edington",
      "hundred-years-war",
      "seven-years-war",
      "american-war-of-independence",
      "australia-convict-transportation",
      "impact-of-wwi-on-the-british-empire",
      "impact-of-wwi-on-india",
      "impact-of-wwii-on-india",
      "impact-of-wwii-on-africa",
      "wwii-in-the-east-and-the-fall-of-singapore",
      "african-independence-movements",
      "1982-falklands-war"
    ]
  },
  {
    id: "scientific-innovation-technological-superiority",
    title: "Scientific innovation and technological superiority",
    summary:
      "Technology shaped migration and empire by making exploration, conquest, settlement, trade and disease control more possible.",
    keyIdeas: [
      "Viking longships helped raiders navigate rivers and seas and settle across Britain.",
      "Transport and medical technologies supported imperial expansion.",
      "Quinine helped Europeans operate in malarial regions during the Scramble for Africa.",
      "Refrigeration made settler farming in New Zealand more profitable by allowing frozen meat exports to Britain."
    ],
    relatedCardIds: [
      "danish-invasions",
      "walter-raleigh",
      "roanoke",
      "jamestown-and-virginia-company",
      "suez-canal",
      "scramble-for-africa",
      "migration-to-new-zealand",
      "internal-migration-industrialisation",
      "east-india-company"
    ]
  },
  {
    id: "identity",
    title: "Identity",
    summary:
      "Migration, conflict and empire reshaped how people understood themselves, from English national identity to American independence and Black British identity.",
    keyIdeas: [
      "Conflict can strengthen shared identity, as with the emergence of Englishness in the Middle Ages.",
      "Coexistence and intermarriage in the Danelaw helped create Anglo-Dane culture and shared language.",
      "During the American War of Independence, many colonists came to identify less as British and more as independent Americans.",
      "Post-war migration helped reshape British identity into a more multicultural idea of belonging."
    ],
    relatedCardIds: [
      "danish-invasions",
      "treaty-of-wedmore",
      "alfred-the-great",
      "battle-of-lincoln",
      "hundred-years-war",
      "american-war-of-independence",
      "windrush-caribbean-migration",
      "west-indian-gazette",
      "notting-hill-carnival",
      "members-of-parliament-from-ethnic-minorities",
      "parliamentary-black-caucus"
    ]
  },
  {
    id: "multiracialism",
    title: "Multiracialism",
    summary:
      "In colonial East Africa, multiracialism often meant unequal power-sharing between white settlers and African populations, with white minorities retaining disproportionate power.",
    keyIdeas: [
      "White minorities used multiracialism to protect political influence beyond their numbers.",
      "After World War II, white settlers were encouraged to move to Kenya to help rebuild Britain’s economic strength.",
      "Black nationalists in Kenya rejected unequal multiracialism.",
      "The conflict contributed to Mau Mau resistance and eventual movement towards one-person-one-vote independence in 1963."
    ],
    relatedCardIds: [
      "migration-to-and-from-canada",
      "migration-to-new-zealand",
      "jomo-kenyatta",
      "mau-mau",
      "hola-detention-camp",
      "kenyan-independence",
      "impact-of-wwii-on-africa",
      "african-independence-movements"
    ]
  },
  {
    id: "manifest-destiny-white-mans-burden",
    title: "Manifest Destiny and the White Man’s Burden",
    summary:
      "Imperial ideologies such as Manifest Destiny and the White Man’s Burden claimed that white Europeans had a moral duty to rule, civilise and Christianise others.",
    keyIdeas: [
      "These ideas were based on white supremacist assumptions.",
      "Writers such as Rudyard Kipling argued that Europeans had a duty to bring Christianity, commerce and civilisation to people they considered less developed.",
      "Missionaries such as Mary Slessor moved to Africa to set up schools and hospitals.",
      "These beliefs gained support for imperial projects such as the Uganda railway."
    ],
    relatedCardIds: [
      "scramble-for-africa",
      "cecil-john-rhodes",
      "rhodesia",
      "matabeleland",
      "sierra-leone",
      "indian-indentured-servants",
      "british-raj",
      "east-india-company"
    ]
  },
  {
    id: "multiculturalism",
    title: "Multiculturalism",
    summary:
      "Multiculturalism describes a society where different racial, religious and cultural groups coexist and reshape national identity.",
    keyIdeas: [
      "In Britain, multiculturalism developed as democracy gradually accepted that Britishness could include different cultures.",
      "The 1948 British Nationality Act allowed Commonwealth citizens to live and work in Britain.",
      "Caribbean and South Asian migration contributed to modern multicultural Britain.",
      "EU migration also contributed to a broader European multicultural identity."
    ],
    relatedCardIds: [
      "windrush-caribbean-migration",
      "claudia-jones",
      "west-indian-gazette",
      "notting-hill-carnival",
      "equal-opportunities-legislation",
      "ugandan-asian-immigration",
      "migration-from-the-eu",
      "expansion-of-the-european-union-2004-2007",
      "members-of-parliament-from-ethnic-minorities",
      "bernard-grant"
    ]
  },
  {
    id: "religion",
    title: "Religion",
    summary:
      "Religion acted as both a push factor for those fleeing persecution and a pull factor for those seeking to spread or freely practise their faith.",
    keyIdeas: [
      "Around 50,000 Huguenot Protestants fled France for England after the Edict of Nantes was revoked in 1685.",
      "Thousands of Jews fled Russian pogroms in the late nineteenth century.",
      "Puritans, Quakers and Catholics migrated to North America to worship more freely.",
      "Religious conversion and Christianisation were also part of empire and settlement."
    ],
    relatedCardIds: [
      "treaty-of-wedmore",
      "huguenot-immigration",
      "pilgrim-fathers",
      "jewish-migration",
      "sierra-leone",
      "scramble-for-africa",
      "manifest-destiny-white-mans-burden"
    ]
  },
  {
    id: "liberty-and-freedom",
    title: "Liberty and Freedom",
    summary:
      "Ideas of liberty and freedom fuelled campaigns against monarchy, slavery, imperial rule and unequal political power.",
    keyIdeas: [
      "Campaigns to limit monarchy can be seen in Magna Carta and later constitutional arguments.",
      "Abolitionists such as Granville Sharp and William Wilberforce challenged slavery and helped end the slave trade in 1807.",
      "American colonists used arguments about liberty and no taxation without representation to oppose British rule.",
      "Anti-colonial movements used freedom language to demand self-government and independence."
    ],
    relatedCardIds: [
      "magna-carta",
      "slave-trade-and-abolition",
      "american-war-of-independence",
      "indian-national-congress",
      "hindswaraj",
      "satyagraha",
      "salt-march",
      "quit-india",
      "african-independence-movements",
      "pan-african-conference",
      "cpp"
    ]
  },
  {
    id: "racism",
    title: "Racism",
    summary:
      "Racism justified slavery, empire, exclusionary immigration policy and everyday discrimination, but also provoked resistance and civil rights campaigns.",
    keyIdeas: [
      "Racism was used to justify slavery and the colour bar.",
      "The colour bar restricted non-white migrants from jobs and decent housing.",
      "Enoch Powell’s 1968 Rivers of Blood speech intensified anti-immigrant sentiment.",
      "The 1962 and 1971 Commonwealth Immigrants Acts restricted entry.",
      "Idi Amin’s expulsion of Asians from Uganda forced people to migrate to Britain to escape state-sponsored racial persecution."
    ],
    relatedCardIds: [
      "slave-trade-and-abolition",
      "caribbean-plantations",
      "cecil-john-rhodes",
      "rhodesia",
      "windrush-caribbean-migration",
      "enoch-powell",
      "racist-violence-nf-bnp-and-anti-racist-groups",
      "sus-laws",
      "equal-opportunities-legislation",
      "ugandan-asian-immigration",
      "idi-amin",
      "claudia-jones",
      "west-indian-gazette"
    ]
  },
  {
    id: "economic-reasons-business-and-resources",
    title: "Economic Reasons: Business and Resources",
    summary:
      "The search for wealth, labour, land and raw materials was a central driver of migration, empire and industrial change.",
    keyIdeas: [
      "Gold, sugar, tobacco and tea helped drive British imperial expansion.",
      "Industrialisation drew internal migrants and Irish navvies into cities such as London and Liverpool for factory and railway work.",
      "Raleigh and the Virginia Company established colonies in North America to grow cash crops such as tobacco.",
      "The East India Company expanded through trade in goods such as silk, tea and spices.",
      "The Scramble for Africa was driven partly by demand for gold, diamonds, ivory and strategic routes."
    ],
    relatedCardIds: [
      "jamestown-and-virginia-company",
      "caribbean-plantations",
      "slave-trade-and-abolition",
      "east-india-company",
      "robert-clive",
      "battle-of-plassey",
      "treaty-of-allahabad",
      "internal-migration-industrialisation",
      "irish-migration-and-home-rule",
      "suez-canal",
      "scramble-for-africa",
      "cecil-john-rhodes",
      "matabeleland",
      "migration-to-new-zealand",
      "migration-from-the-eu"
    ]
  }
];
