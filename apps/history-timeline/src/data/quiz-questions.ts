// src/data/quiz-questions.ts
export interface Question {
  cardId: string;
  question: string;
  correct: string;
  options: string[];
  explanation: string;
}

export const quizQuestions: Question[] = [
  {
    "cardId": "danish-invasions",
    "question": "What was one long-term result of the Danish invasions of England?",
    "correct": "The growth of the Danelaw and cultural blending between Anglo-Saxons and Vikings",
    "options": [
      "The growth of the Danelaw and cultural blending between Anglo-Saxons and Vikings",
      "The signing of Magna Carta to limit royal power",
      "The creation of the Pale around Dublin",
      "The founding of the East India Company"
    ],
    "explanation": "The invasions led to Viking settlement in the Danelaw, while Magna Carta and the Pale belong to much later medieval developments."
  },
  {
    "cardId": "alfred-the-great",
    "question": "Why is Alfred the Great important in the story of Viking migration into England?",
    "correct": "He resisted Viking conquest and helped preserve Wessex as an Anglo-Saxon kingdom",
    "options": [
      "He resisted Viking conquest and helped preserve Wessex as an Anglo-Saxon kingdom",
      "He conquered England and ruled a North Sea Empire",
      "He created the first English colony in North America",
      "He led the Norman Conquest of 1066"
    ],
    "explanation": "Alfred’s victory at Edington and his reforms helped Wessex survive rather than become fully absorbed into Viking-controlled territory."
  },
  {
    "cardId": "battle-of-edington",
    "question": "What happened at the Battle of Edington in 878?",
    "correct": "Alfred defeated Guthrum’s Viking army and saved Wessex from full conquest",
    "options": [
      "Alfred defeated Guthrum’s Viking army and saved Wessex from full conquest",
      "Cnut conquered England and made it part of a North Sea Empire",
      "William Marshal defeated a French-backed invasion force",
      "Henry II invaded Ireland to control Anglo-Norman lords"
    ],
    "explanation": "Edington was Alfred’s key military victory over Guthrum; Cnut, William Marshal and Henry II belong to different episodes."
  },
  {
    "cardId": "treaty-of-wedmore",
    "question": "What did the Treaty of Wedmore help establish after Edington?",
    "correct": "A formal division between Anglo-Saxon territory and the Viking-ruled Danelaw",
    "options": [
      "A formal division between Anglo-Saxon territory and the Viking-ruled Danelaw",
      "A charter limiting King John’s power after baronial revolt",
      "A British base around Dublin known as the Pale",
      "A monopoly on English trade with India"
    ],
    "explanation": "Wedmore stabilised relations after Edington by recognising a boundary with the Danelaw."
  },
  {
    "cardId": "emma-of-normandy",
    "question": "Why does Emma of Normandy matter for understanding migration and power before 1066?",
    "correct": "She linked English, Danish and Norman dynasties through marriage and succession",
    "options": [
      "She linked English, Danish and Norman dynasties through marriage and succession",
      "She led armed resistance to the Vikings at Edington",
      "She founded the Danelaw as a Viking settlement zone",
      "She negotiated Magna Carta with King John"
    ],
    "explanation": "Emma’s marriages and sons connected several ruling dynasties, helping explain the complex background to the Norman Conquest."
  },
  {
    "cardId": "cnut-the-great",
    "question": "What made Cnut’s rule different from earlier Viking raids?",
    "correct": "He ruled England as part of a stable North Sea Empire rather than simply raiding it",
    "options": [
      "He ruled England as part of a stable North Sea Empire rather than simply raiding it",
      "He forced King John to accept limits on royal power",
      "He led Puritan settlers to New Plymouth",
      "He founded the East India Company’s private army"
    ],
    "explanation": "Cnut turned Viking power into kingship and integrated England into northern trade networks."
  },
  {
    "cardId": "henry-ii",
    "question": "Why is Henry II significant for the history of English involvement in Ireland?",
    "correct": "He invaded Ireland in 1171 and asserted English overlordship across the Irish Sea",
    "options": [
      "He invaded Ireland in 1171 and asserted English overlordship across the Irish Sea",
      "He lost Normandy to Philip II of France in 1204",
      "He signed Magna Carta after a baronial rebellion",
      "He ended Prince Louis’s claim to the English throne"
    ],
    "explanation": "Henry II’s intervention in Ireland began centuries of English and later British involvement there."
  },
  {
    "cardId": "strongbow-invasion-of-ireland",
    "question": "What was a key consequence of Henry II and Strongbow’s involvement in Ireland?",
    "correct": "The creation of the Pale around Dublin and long-term English involvement in Ireland",
    "options": [
      "The creation of the Pale around Dublin and long-term English involvement in Ireland",
      "The end of the Angevin Empire after the loss of Normandy",
      "The growth of English as the language of government after war with France",
      "The foundation of the first permanent English colony in North America"
    ],
    "explanation": "The invasion created an English power base around Dublin, unlike the French or North American developments in the other options."
  },
  {
    "cardId": "king-john",
    "question": "What crisis made King John important to later constitutional government?",
    "correct": "His military failures and taxes led to baronial rebellion and Magna Carta",
    "options": [
      "His military failures and taxes led to baronial rebellion and Magna Carta",
      "His victory at Edington created the Danelaw boundary",
      "His invasion of Ireland created the Pale",
      "His support for the Mayflower Compact created New Plymouth"
    ],
    "explanation": "John’s loss of Normandy and taxation helped trigger Magna Carta, which limited royal power."
  },
  {
    "cardId": "loss-of-normandy",
    "question": "Why did the Loss of Normandy in 1204 matter for England?",
    "correct": "It weakened the Angevin Empire and contributed to taxation pressures that led to Magna Carta",
    "options": [
      "It weakened the Angevin Empire and contributed to taxation pressures that led to Magna Carta",
      "It allowed Vikings to settle permanently in the Danelaw",
      "It gave the East India Company the right to collect taxes in Bengal",
      "It caused Britain to lose the 13 American colonies"
    ],
    "explanation": "John’s loss of French lands pushed him into unpopular taxation and helped provoke baronial revolt."
  },
  {
    "cardId": "magna-carta",
    "question": "What principle is Magna Carta mainly remembered for?",
    "correct": "The monarch should be subject to the law",
    "options": [
      "The monarch should be subject to the law",
      "The king should control all trade with India",
      "The Danelaw should be ruled by Viking law only",
      "The colonies should have no taxation from Britain"
    ],
    "explanation": "Magna Carta mattered because it limited royal power and set a precedent for lawful government."
  },
  {
    "cardId": "battle-of-lincoln",
    "question": "What was the immediate importance of the Battle of Lincoln in 1217?",
    "correct": "It secured Henry III’s throne and ended Prince Louis’s attempt to take the English crown",
    "options": [
      "It secured Henry III’s throne and ended Prince Louis’s attempt to take the English crown",
      "It forced King John to sign Magna Carta",
      "It gave Henry II control over the Pale in Ireland",
      "It ended English claims to land in France"
    ],
    "explanation": "Lincoln defeated the French-backed threat after John’s death; Magna Carta had already been signed in 1215."
  },
  {
    "cardId": "hundred-years-war",
    "question": "How did the Hundred Years War affect English identity?",
    "correct": "It helped create a distinct English identity as England lost most of its French lands",
    "options": [
      "It helped create a distinct English identity as England lost most of its French lands",
      "It created a Danish-English North Sea Empire",
      "It began English political involvement in Ireland",
      "It established Britain’s control of India through company rule"
    ],
    "explanation": "The war shifted England away from its continental holdings and strengthened the use of English in government and kingship."
  },
  {
    "cardId": "sir-john-hawkins",
    "question": "What is Sir John Hawkins mainly known for in this topic?",
    "correct": "Opening England’s involvement in the transatlantic slave trade in the 1560s",
    "options": [
      "Opening England’s involvement in the transatlantic slave trade in the 1560s",
      "Organising the Roanoke expedition in North America",
      "Creating the Bank of England with Huguenot financiers",
      "Founding the East India Company in 1600"
    ],
    "explanation": "Hawkins’ voyages captured and sold Africans, making him central to England’s early slave-trading involvement."
  },
  {
    "cardId": "walter-raleigh",
    "question": "Why is Walter Raleigh linked to early English colonisation?",
    "correct": "He organised the Roanoke expedition as an attempted permanent English settlement in North America",
    "options": [
      "He organised the Roanoke expedition as an attempted permanent English settlement in North America",
      "He began England’s slave-trading voyages to Spanish colonies",
      "He led the Pilgrim Fathers to New Plymouth",
      "He created the sugar plantation system in Barbados"
    ],
    "explanation": "Raleigh’s Roanoke failed, but it showed that English overseas settlement was possible."
  },
  {
    "cardId": "roanoke",
    "question": "Why did Roanoke become known as the “Lost Colony”?",
    "correct": "The settlement failed after problems including lack of supplies, disease and conflict with Indigenous people",
    "options": [
      "The settlement failed after problems including lack of supplies, disease and conflict with Indigenous people",
      "The colony rebelled against British taxes and declared independence",
      "Its settlers were transported convicts who escaped inland",
      "It was abandoned after the East India Company lost its monopoly"
    ],
    "explanation": "Roanoke was an early failed colony, whereas later Jamestown became the first permanent English settlement."
  },
  {
    "cardId": "slave-trade-and-abolition",
    "question": "Which statement best describes the slave trade and abolition period?",
    "correct": "British wealth from enslaved labour was followed by abolition campaigns and the 1807 ban on the trade",
    "options": [
      "British wealth from enslaved labour was followed by abolition campaigns and the 1807 ban on the trade",
      "Puritan migration created democratic settlements and the Mayflower Compact",
      "Convict transportation built settlements in Australia from 1787",
      "The Seven Years War created debt and taxation of American colonists"
    ],
    "explanation": "The card links plantation slavery and port wealth to abolition, especially the 1807 Act banning the trade."
  },
  {
    "cardId": "east-india-company",
    "question": "How did the East India Company change over time?",
    "correct": "It shifted from a trading company into a governing power with its own army in India",
    "options": [
      "It shifted from a trading company into a governing power with its own army in India",
      "It moved Puritan families from England to Massachusetts",
      "It organised convict transportation to Australia",
      "It led anti-racist campaigns in post-war Britain"
    ],
    "explanation": "The East India Company began as a joint-stock trading company but later governed large parts of India."
  },
  {
    "cardId": "ulster-plantations",
    "question": "What was the long-term impact of the Ulster Plantations?",
    "correct": "They deepened sectarian division and contributed to the later partition of Ireland",
    "options": [
      "They deepened sectarian division and contributed to the later partition of Ireland",
      "They created the Danelaw as a mixed Anglo-Danish settlement",
      "They established New Plymouth through the Mayflower Compact",
      "They gave Britain a strategic route to India through Egypt"
    ],
    "explanation": "The plantations displaced Irish Catholics and settled loyal Protestants, creating lasting religious and political division."
  },
  {
    "cardId": "pilgrim-fathers",
    "question": "Why did the Pilgrim Fathers migrate in 1620?",
    "correct": "They were Puritans fleeing religious persecution in England",
    "options": [
      "They were Puritans fleeing religious persecution in England",
      "They were convicts sent to relieve prison overcrowding",
      "They were Huguenots fleeing the revocation of the Edict of Nantes",
      "They were enslaved Africans forced to work on sugar plantations"
    ],
    "explanation": "The Pilgrim Fathers’ migration was religious, while Huguenot migration came later from France."
  },
  {
    "cardId": "jamestown-and-virginia-company",
    "question": "What made Jamestown important in English colonisation?",
    "correct": "It became the first permanent English settlement in North America",
    "options": [
      "It became the first permanent English settlement in North America",
      "It was the first Puritan settlement based on the Mayflower Compact",
      "It was a failed colony known as the Lost Colony",
      "It was a colony for the Black Poor and formerly enslaved people"
    ],
    "explanation": "Jamestown succeeded where Roanoke failed and became a model for later colonial expansion."
  },
  {
    "cardId": "caribbean-plantations",
    "question": "What linked Caribbean plantations to the growth of empire?",
    "correct": "Sugar plantations used enslaved African labour and generated major wealth for Britain",
    "options": [
      "Sugar plantations used enslaved African labour and generated major wealth for Britain",
      "Puritan farms in New Plymouth created democratic government",
      "Convict labour built early settlements in Australia",
      "Indian indentured labour built East African railways"
    ],
    "explanation": "Barbados and other Caribbean colonies tied sugar profits directly to the institutionalisation of slavery."
  },
  {
    "cardId": "robert-clive",
    "question": "Why was Robert Clive’s victory at Plassey significant?",
    "correct": "It allowed the East India Company to take political control of Bengal",
    "options": [
      "It allowed the East India Company to take political control of Bengal",
      "It gave Britain control of Canada after war with France",
      "It ended the slave trade through the 1807 Act",
      "It created the Indian National Congress in 1885"
    ],
    "explanation": "Plassey made the company a ruling power in Bengal, not just a trading organisation."
  },
  {
    "cardId": "warren-hastings",
    "question": "What was Warren Hastings’ main contribution to British rule in India?",
    "correct": "He built administrative and legal frameworks for East India Company rule",
    "options": [
      "He built administrative and legal frameworks for East India Company rule",
      "He won the Battle of Plassey against the Nawab of Bengal",
      "He granted the East India Company the diwani in Bengal",
      "He founded the Indian National Congress"
    ],
    "explanation": "Hastings is linked to governing structures, while Clive is linked to Plassey and military conquest."
  },
  {
    "cardId": "huguenot-immigration",
    "question": "Why did Huguenots migrate to England around 1685?",
    "correct": "They were French Protestants fleeing persecution after the revocation of the Edict of Nantes",
    "options": [
      "They were French Protestants fleeing persecution after the revocation of the Edict of Nantes",
      "They were Puritans sailing on the Mayflower to New Plymouth",
      "They were Irish migrants escaping the Great Famine",
      "They were Jewish migrants fleeing pogroms in the Russian Empire"
    ],
    "explanation": "Huguenot migration was driven by religious persecution in France and brought skilled workers to England."
  },
  {
    "cardId": "american-war-of-independence",
    "question": "What was a long-term imperial consequence of the American War of Independence?",
    "correct": "Britain shifted greater imperial attention towards India and Africa",
    "options": [
      "Britain shifted greater imperial attention towards India and Africa",
      "Britain gained Canada and imposed taxes that caused colonial anger",
      "Britain created a formal Danelaw boundary with Viking settlers",
      "Britain bought a stake in the Suez Canal to reach India faster"
    ],
    "explanation": "Losing the 13 colonies forced Britain to redirect imperial ambition elsewhere, especially India and Africa."
  },
  {
    "cardId": "highland-clearances",
    "question": "What caused many people to leave the Scottish Highlands in the late eighteenth and nineteenth centuries?",
    "correct": "Tenant farmers were forcibly evicted by landowners making room for sheep farming",
    "options": [
      "Tenant farmers were forcibly evicted by landowners making room for sheep farming",
      "Puritans fled religious persecution and sailed on the Mayflower",
      "British prisoners were transported to Australia to reduce overcrowding",
      "Jewish communities fled pogroms in the Russian Empire"
    ],
    "explanation": "The Highland Clearances displaced tenant farmers and helped drive Scottish migration to cities and colonies such as Canada and New Zealand."
  },
  {
    "cardId": "irish-migration-and-home-rule",
    "question": "What linked Irish migration to Britain with the Home Rule movement?",
    "correct": "Poverty and famine drove migration while political campaigns sought Irish self-government",
    "options": [
      "Poverty and famine drove migration while political campaigns sought Irish self-government",
      "Viking settlement created the Danelaw and merged Anglo-Dane cultures",
      "EU enlargement led to free movement from Eastern Europe",
      "The Berlin Conference divided Africa among European powers"
    ],
    "explanation": "Irish people migrated for work and survival, while Home Rule reflected the parallel demand for political self-government in Ireland."
  },
  {
    "cardId": "sierra-leone",
    "question": "Why was Sierra Leone established in 1787?",
    "correct": "As a colony for the “Black Poor” and later formerly enslaved people",
    "options": [
      "As a colony for the “Black Poor” and later formerly enslaved people",
      "As a sugar plantation colony based on enslaved African labour",
      "As a penal colony for transported British prisoners",
      "As a base for the East India Company’s private army"
    ],
    "explanation": "Sierra Leone connected abolition, resettlement and British influence in West Africa."
  },
  {
    "cardId": "seven-years-war",
    "question": "How did the Seven Years War help lead to the American War of Independence?",
    "correct": "Its debt pushed Britain to tax American colonists directly",
    "options": [
      "Its debt pushed Britain to tax American colonists directly",
      "It forced Britain to give up Canada to France",
      "It gave the East India Company tax rights in Bengal",
      "It led to the expulsion of Asians from Uganda"
    ],
    "explanation": "Britain won Canada but the £133 million debt made colonial taxation more likely."
  },
  {
    "cardId": "australia-convict-transportation",
    "question": "What was the short-term purpose of convict transportation to Australia?",
    "correct": "To reduce prison overcrowding and provide labour for early settlements",
    "options": [
      "To reduce prison overcrowding and provide labour for early settlements",
      "To settle Puritans seeking religious freedom",
      "To give Huguenot craftsmen new work in colonial towns",
      "To create an anti-slavery patrol base in West Africa"
    ],
    "explanation": "Convicts supplied labour in Australia after Britain needed new penal destinations and colonial settlements."
  },
  {
    "cardId": "internal-migration-industrialisation",
    "question": "What drove internal migration in Britain between 1750 and 1900?",
    "correct": "Movement from the countryside to cities for factory and railway work",
    "options": [
      "Movement from the countryside to cities for factory and railway work",
      "Forced transportation of prisoners to Australia",
      "Irish self-government campaigns after the Easter Rising",
      "Eastern European migration after EU enlargement"
    ],
    "explanation": "Industrialisation pulled workers into cities, causing overcrowding and disease but transforming Britain into an urban society."
  },
  {
    "cardId": "treaty-of-allahabad",
    "question": "What did the Treaty of Allahabad grant to the East India Company?",
    "correct": "The diwani, or right to collect tax revenues in Bengal",
    "options": [
      "The diwani, or right to collect tax revenues in Bengal",
      "A monopoly on all trade with the Caribbean sugar colonies",
      "The right to transport convicts to Australia",
      "A seat in the Indian National Congress"
    ],
    "explanation": "The diwani turned the company into the effective government of Bengal by giving it revenue power."
  },
  {
    "cardId": "battle-of-plassey",
    "question": "What did the Battle of Plassey establish for the East India Company?",
    "correct": "Military dominance in Bengal and a power base for expansion in India",
    "options": [
      "Military dominance in Bengal and a power base for expansion in India",
      "Direct Crown rule over India after the 1857 rebellion",
      "A settler colony in West Africa for formerly enslaved people",
      "The formal partition of Ireland after sectarian conflict"
    ],
    "explanation": "Plassey came before Allahabad and helped make later company rule in Bengal possible."
  },
  {
    "cardId": "1784-india-act",
    "question": "Why did Parliament pass the 1784 India Act?",
    "correct": "To increase government control over the East India Company and reduce corruption",
    "options": [
      "To increase government control over the East India Company and reduce corruption",
      "To ban the transatlantic slave trade throughout the British Empire",
      "To grant India immediate independence from Crown rule",
      "To allow free movement of workers across the European Union"
    ],
    "explanation": "The Act did not end company rule, but it brought the company under tighter state oversight."
  },
  {
    "cardId": "british-raj",
    "question": "What marked the start of the British Raj in 1858?",
    "correct": "Direct Crown rule after the Great Rebellion and abolition of East India Company rule",
    "options": [
      "Direct Crown rule after the Great Rebellion and abolition of East India Company rule",
      "The East India Company’s first monopoly charter in 1600",
      "The formation of the Indian National Congress by educated Indians",
      "The Salt March against taxes on a basic necessity"
    ],
    "explanation": "The Raj began when the British government took over responsibilities from the East India Company after 1857."
  },
  {
    "cardId": "scramble-for-africa",
    "question": "What was the Scramble for Africa mainly about?",
    "correct": "European powers rapidly colonising Africa for resources, trade routes and strategic bases",
    "options": [
      "European powers rapidly colonising Africa for resources, trade routes and strategic bases",
      "African leaders demanding independence at a Manchester conference",
      "Caribbean migrants rebuilding Britain’s post-war transport and health sectors",
      "British prisoners being transported to build Australian settlements"
    ],
    "explanation": "The Scramble was an imperial land grab, formalised by events such as the Berlin Conference."
  },
  {
    "cardId": "jameson-raid",
    "question": "Why did the Jameson Raid worsen relations in Southern Africa?",
    "correct": "It was a failed British-backed attempt to remove Boer president Paul Kruger by force",
    "options": [
      "It was a failed British-backed attempt to remove Boer president Paul Kruger by force",
      "It gave Cecil Rhodes exclusive mining rights from King Lobengula",
      "It created Ghana as the first Black African colony to gain independence",
      "It forced Britain to repeal the sus laws after riots"
    ],
    "explanation": "The raid embarrassed Britain, forced Rhodes to resign and helped move Britain and the Boers towards war."
  },
  {
    "cardId": "indian-national-congress",
    "question": "What was the original purpose of the Indian National Congress?",
    "correct": "To give educated Indians a political organisation demanding greater participation in government",
    "options": [
      "To give educated Indians a political organisation demanding greater participation in government",
      "To organise British anti-slavery naval patrols from West Africa",
      "To defend Boer independence against British expansion",
      "To recruit Indian workers to build railways in East Africa"
    ],
    "explanation": "The Congress began with moderate demands before becoming central to nationalist resistance."
  },
  {
    "cardId": "suez-canal",
    "question": "Why was the Suez Canal strategically important to Britain?",
    "correct": "It shortened the route to India by linking the Mediterranean and Red Sea",
    "options": [
      "It shortened the route to India by linking the Mediterranean and Red Sea",
      "It gave the East India Company control over Bengal’s tax revenues",
      "It connected British settlers in Canada to the Atlantic colonies",
      "It allowed Vikings to trade through Jorvik and the Danelaw"
    ],
    "explanation": "Suez made Egypt a gateway to empire because it protected the route to India."
  },
  {
    "cardId": "cecil-john-rhodes",
    "question": "What did Cecil Rhodes symbolise in late nineteenth-century empire?",
    "correct": "Aggressive British expansion in Southern Africa linked to mining wealth and Social Darwinism",
    "options": [
      "Aggressive British expansion in Southern Africa linked to mining wealth and Social Darwinism",
      "Non-violent resistance to British rule through boycotts and civil disobedience",
      "Post-war Caribbean campaigning against the colour bar in housing",
      "A parliamentary voice for Black British communities in the 1980s"
    ],
    "explanation": "Rhodes used mining wealth and racial ideology to expand British power in Southern Africa."
  },
  {
    "cardId": "matabeleland",
    "question": "What happened in Matabeleland in 1888?",
    "correct": "Cecil Rhodes obtained mining rights from King Lobengula, leading to exploitation and displacement",
    "options": [
      "Cecil Rhodes obtained mining rights from King Lobengula, leading to exploitation and displacement",
      "The Berlin Conference divided Africa among European powers",
      "The East India Company gained tax rights in Bengal",
      "Britain accepted Ugandan Asian refugees after expulsion"
    ],
    "explanation": "Matabeleland links Rhodes’ mining interests to the dispossession of the Ndebele and the creation of Rhodesia."
  },
  {
    "cardId": "rhodesia",
    "question": "What did Rhodesia represent in the revision cards?",
    "correct": "British settler expansion and mineral exploitation in Southern Africa under Cecil Rhodes",
    "options": [
      "British settler expansion and mineral exploitation in Southern Africa under Cecil Rhodes",
      "A West African colony for the Black Poor and formerly enslaved people",
      "A treaty creating the Danelaw after Viking defeat",
      "A campaign for Indian self-rule after the First World War"
    ],
    "explanation": "Rhodesia embodied nineteenth-century imperialism and racial hierarchy in Southern Africa."
  },
  {
    "cardId": "migration-to-new-zealand",
    "question": "What drew British settlers to New Zealand in the nineteenth century?",
    "correct": "Organised settlement, farming opportunities and mineral discoveries",
    "options": [
      "Organised settlement, farming opportunities and mineral discoveries",
      "Religious persecution after the Edict of Nantes was revoked",
      "Prison overcrowding in Britain and convict transportation",
      "The need to staff the NHS after the Second World War"
    ],
    "explanation": "New Zealand migration was settler colonial migration linked to farms, gold and later food supply to Britain."
  },
  {
    "cardId": "jewish-migration-1881-1914",
    "question": "Why did many Jews migrate to Britain between 1881 and 1914?",
    "correct": "They fled pogroms in the Russian Empire and settled in cities such as London",
    "options": [
      "They fled pogroms in the Russian Empire and settled in cities such as London",
      "They were expelled from Uganda by Idi Amin",
      "They were transported as convicts to Australia",
      "They were recruited from India to build East African railways"
    ],
    "explanation": "Jewish migration was driven by persecution in Eastern Europe and later contributed to debates behind the 1905 Aliens Act."
  },
  {
    "cardId": "migration-to-and-from-canada",
    "question": "Which group was especially linked to nineteenth-century migration to Canada?",
    "correct": "British settlers, including Scots displaced by the Highland Clearances",
    "options": [
      "British settlers, including Scots displaced by the Highland Clearances",
      "Caribbean migrants recruited to rebuild the NHS",
      "Indian workers sent to build railways in Kenya and Uganda",
      "Puritans fleeing persecution on the Mayflower"
    ],
    "explanation": "Canada became a major destination for settlers seeking land and opportunity, including those displaced in Scotland."
  },
  {
    "cardId": "indian-indentured-servants",
    "question": "Why were Indian indentured servants sent to East Africa in the late nineteenth century?",
    "correct": "To build railways in colonies such as Kenya and Uganda",
    "options": [
      "To build railways in colonies such as Kenya and Uganda",
      "To collect salt in protest against British taxes",
      "To campaign against the colour bar in London housing",
      "To establish the first permanent English colony in North America"
    ],
    "explanation": "Indentured labour created an Indian diaspora in East Africa, later affected by expulsions such as Idi Amin’s."
  },
  {
    "cardId": "impact-of-wwi-on-british-empire",
    "question": "How did the First World War weaken the British Empire?",
    "correct": "It drained Britain’s economy and encouraged colonial nationalism as soldiers returned home",
    "options": [
      "It drained Britain’s economy and encouraged colonial nationalism as soldiers returned home",
      "It gave Britain a new monopoly over trade with India",
      "It ended Viking settlement in the Danelaw",
      "It created free movement of workers within the EU"
    ],
    "explanation": "Colonial soldiers fought for Britain, but their wartime service strengthened demands for self-rule afterwards."
  },
  {
    "cardId": "impact-of-wwi-on-india",
    "question": "What did India’s contribution to WWI help strengthen?",
    "correct": "The demand for Home Rule and independence among Indian nationalists",
    "options": [
      "The demand for Home Rule and independence among Indian nationalists",
      "The campaign to settle loyal Protestants in Ulster",
      "The use of convict labour in Australia",
      "The British purchase of the Suez Canal stake"
    ],
    "explanation": "India supplied over one million soldiers and financial support, but limited reform fed nationalist frustration."
  },
  {
    "cardId": "mahatma-gandhi",
    "question": "What made Mahatma Gandhi central to Indian independence?",
    "correct": "He led non-violent resistance through boycotts and civil disobedience against British rule",
    "options": [
      "He led non-violent resistance through boycotts and civil disobedience against British rule",
      "He founded the East India Company’s legal framework",
      "He led the Gold Coast to independence in 1957",
      "He organised Caribbean carnival after the Notting Hill riots"
    ],
    "explanation": "Gandhi’s methods challenged British legitimacy and inspired later civil rights and decolonisation movements."
  },
  {
    "cardId": "hind-swaraj",
    "question": "What was the main argument of Hind Swaraj?",
    "correct": "British rule in India depended on Indian cooperation and could be resisted through self-rule ideas",
    "options": [
      "British rule in India depended on Indian cooperation and could be resisted through self-rule ideas",
      "Britain needed to join the EEC to find new trading partners",
      "African colonies should form the modern Commonwealth",
      "Police should have wider powers to stop and search suspects"
    ],
    "explanation": "Hind Swaraj gave Gandhi an ideological basis for rejecting Western rule and promoting Indian self-rule."
  },
  {
    "cardId": "satyagraha",
    "question": "What does Satyagraha refer to in Gandhi’s campaigns?",
    "correct": "Mass non-violent resistance or “truth-force” against British rule",
    "options": [
      "Mass non-violent resistance or “truth-force” against British rule",
      "The East India Company’s right to collect taxes in Bengal",
      "A British law allowing police to stop suspected criminals",
      "A Conservative speech opposing Commonwealth migration"
    ],
    "explanation": "Satyagraha used boycotts and civil disobedience to weaken British moral authority."
  },
  {
    "cardId": "salt-march",
    "question": "Why was the Salt March such an effective protest?",
    "correct": "It used a basic necessity to expose the injustice of British monopoly and taxation",
    "options": [
      "It used a basic necessity to expose the injustice of British monopoly and taxation",
      "It forced Henry II to create the Pale around Dublin",
      "It allowed Britain to buy a stake in the Suez Canal",
      "It created the first Black British weekly newspaper"
    ],
    "explanation": "By marching to collect salt, Gandhi turned an everyday tax into a national and international symbol of injustice."
  },
  {
    "cardId": "cold-war",
    "question": "How did the Cold War affect Britain’s global position?",
    "correct": "Britain’s role was overshadowed by the USA and USSR as decolonisation accelerated",
    "options": [
      "Britain’s role was overshadowed by the USA and USSR as decolonisation accelerated",
      "Britain gained its first major empire through the 13 colonies",
      "Britain took direct control of India through the East India Company",
      "Britain created the Mayflower Compact in New Plymouth"
    ],
    "explanation": "After 1945 Britain was no longer one of the two superpowers, which made imperial control harder to sustain."
  },
  {
    "cardId": "african-independence-movements",
    "question": "What characterised African independence movements after the Second World War?",
    "correct": "Campaigns by African nations to end British colonial rule and gain self-government",
    "options": [
      "Campaigns by African nations to end British colonial rule and gain self-government",
      "British attempts to settle loyal Protestants in Ulster",
      "The creation of the Danelaw after Viking invasion",
      "English merchants financing the first slave-trading voyages"
    ],
    "explanation": "Movements in places such as Ghana and Kenya turned wartime change into demands for independence."
  },
  {
    "cardId": "impact-of-wwii-on-india",
    "question": "How did WWII contribute to Indian independence?",
    "correct": "Britain’s post-war weakness and the Quit India movement made continued rule difficult",
    "options": [
      "Britain’s post-war weakness and the Quit India movement made continued rule difficult",
      "It made the East India Company the effective government of Bengal",
      "It created the first major English settlement at Jamestown",
      "It gave Britain control of Canada after war with France"
    ],
    "explanation": "India supplied 2.5 million soldiers, while wartime nationalism made British withdrawal increasingly likely."
  },
  {
    "cardId": "impact-of-wwii-on-africa",
    "question": "Why did WWII encourage decolonisation in Africa?",
    "correct": "African veterans returned with new skills and ideas about democracy while British power weakened",
    "options": [
      "African veterans returned with new skills and ideas about democracy while British power weakened",
      "The Berlin Conference divided Africa among European powers",
      "Cecil Rhodes founded the British South Africa Company",
      "Irish navvies built Britain’s roads and railways"
    ],
    "explanation": "The contradiction of fighting for freedom abroad while lacking freedom at home strengthened anti-colonial pressure."
  },
  {
    "cardId": "wwii-east-fall-of-singapore",
    "question": "Why was the Fall of Singapore a blow to British imperial authority?",
    "correct": "It shattered the image of British invincibility in Asia",
    "options": [
      "It shattered the image of British invincibility in Asia",
      "It created the Indian National Congress as a nationalist organisation",
      "It allowed Britain to buy a major stake in the Suez Canal",
      "It led to the repeal of sus laws after Brixton"
    ],
    "explanation": "Japan’s capture of a supposedly impregnable base undermined ideas of European superiority."
  },
  {
    "cardId": "jomo-kenyatta",
    "question": "Why did Jomo Kenyatta become significant in Kenya’s independence struggle?",
    "correct": "His imprisonment and later leadership made him a symbol of self-rule and independence",
    "options": [
      "His imprisonment and later leadership made him a symbol of self-rule and independence",
      "He led the Gold Coast to independence as Ghana",
      "He founded the West Indian Gazette in London",
      "He issued the decree expelling Asians from Uganda"
    ],
    "explanation": "Kenyatta was imprisoned during the Mau Mau period but later led Kenya to independence in 1963."
  },
  {
    "cardId": "quit-india",
    "question": "What did the Quit India movement demand in 1942?",
    "correct": "Immediate British withdrawal from India during the Second World War",
    "options": [
      "Immediate British withdrawal from India during the Second World War",
      "The creation of a settler colony in Sierra Leone",
      "The repeal of the sus laws after the Brixton riots",
      "The admission of Eastern European countries to the EU"
    ],
    "explanation": "Quit India showed that Indian nationalists would not wait until the war ended to demand freedom."
  },
  {
    "cardId": "equal-opportunities-legislation",
    "question": "What was the purpose of equal opportunities legislation from 1965 onwards?",
    "correct": "To combat racial discrimination in employment, housing and public services",
    "options": [
      "To combat racial discrimination in employment, housing and public services",
      "To grant the East India Company a monopoly over Indian trade",
      "To transport convicts to Australian settlements",
      "To settle British Protestants in Ulster"
    ],
    "explanation": "Race Relations Acts in 1965, 1968 and 1976 strengthened legal protection against discrimination."
  },
  {
    "cardId": "windrush-and-caribbean-migration",
    "question": "What challenge did Caribbean migrants face after arriving in post-war Britain?",
    "correct": "Racism, colour bars and violence in housing and employment",
    "options": [
      "Racism, colour bars and violence in housing and employment",
      "Forced eviction to make room for sheep farming",
      "Expulsion from Uganda under Idi Amin",
      "The loss of Normandy to Philip II"
    ],
    "explanation": "Windrush-era migrants helped rebuild Britain but faced discrimination that fed later equality campaigns."
  },
  {
    "cardId": "pan-african-congress-1945-short-card",
    "question": "What did the 1945 Pan-African Congress mark?",
    "correct": "A shift from asking for reforms to demanding full self-government",
    "options": [
      "A shift from asking for reforms to demanding full self-government",
      "The formation of the East India Company as a trading monopoly",
      "The launch of the Salt March against taxation",
      "The start of British membership of the EEC"
    ],
    "explanation": "The Manchester congress helped catalyse decolonisation across Africa in the 1950s and 1960s."
  },
  {
    "cardId": "cold-war-decolonisation-variant",
    "question": "Why did the Cold War shape decolonisation?",
    "correct": "Britain’s imperial role was overshadowed by superpower rivalry and fears over Soviet influence",
    "options": [
      "Britain’s imperial role was overshadowed by superpower rivalry and fears over Soviet influence",
      "The Viking Danelaw created a new boundary in England",
      "The Mayflower Compact inspired Puritan migration",
      "The Battle of Plassey gave Britain control of Canada"
    ],
    "explanation": "Britain had to manage decolonisation in a world dominated by the USA-USSR rivalry."
  },
  {
    "cardId": "enoch-powell",
    "question": "Why was Enoch Powell’s 1968 speech significant?",
    "correct": "It inflamed debate over Commonwealth immigration and national identity",
    "options": [
      "It inflamed debate over Commonwealth immigration and national identity",
      "It launched the first Black British weekly newspaper",
      "It created the Parliamentary Black Caucus",
      "It led Ghana to independence from Britain"
    ],
    "explanation": "Powell’s “Rivers of Blood” speech hardened anti-immigration politics even after he was dismissed."
  },
  {
    "cardId": "claudia-jones",
    "question": "What was Claudia Jones’s contribution to post-war migrant politics and culture?",
    "correct": "She campaigned against the colour bar and helped create Caribbean carnival in Britain",
    "options": [
      "She campaigned against the colour bar and helped create Caribbean carnival in Britain",
      "She led the Gold Coast’s independence movement",
      "She negotiated a rebate from European ministers",
      "She led Kenya after independence in 1963"
    ],
    "explanation": "Jones used journalism and carnival to challenge racism and celebrate Caribbean culture."
  },
  {
    "cardId": "kwame-nkrumah",
    "question": "Why is Kwame Nkrumah important in decolonisation?",
    "correct": "He led Ghana to independence in 1957 and became a symbol of Pan-Africanism",
    "options": [
      "He led Ghana to independence in 1957 and became a symbol of Pan-Africanism",
      "He led Mau Mau detainees at Hola Camp",
      "He organised the Notting Hill Carnival after the 1958 riots",
      "He expelled Asians from Uganda in 1972"
    ],
    "explanation": "Nkrumah’s success in Ghana encouraged wider African nationalist movements."
  },
  {
    "cardId": "west-indian-gazette",
    "question": "What was the purpose of the West Indian Gazette?",
    "correct": "To give Caribbean migrants a voice and campaign against racism in Britain",
    "options": [
      "To give Caribbean migrants a voice and campaign against racism in Britain",
      "To demand self-government for the Gold Coast under Nkrumah",
      "To coordinate anti-slavery patrols from Sierra Leone",
      "To advertise railway work for Indian indentured labourers"
    ],
    "explanation": "Founded by Claudia Jones, it helped build Black British identity and political awareness."
  },
  {
    "cardId": "pan-african-conference-1945",
    "question": "Why was the 1945 Pan-African Conference in Manchester a turning point?",
    "correct": "African leaders moved from asking for reform to demanding full self-rule",
    "options": [
      "African leaders moved from asking for reform to demanding full self-rule",
      "Britain joined the EEC to find new trading partners",
      "Gandhi launched the Salt March against the salt tax",
      "Cecil Rhodes founded Rhodesia in Southern Africa"
    ],
    "explanation": "Leaders such as Nkrumah and Kenyatta returned home with renewed determination to end colonial rule."
  },
  {
    "cardId": "cpp",
    "question": "What was the CPP’s slogan under Kwame Nkrumah?",
    "correct": "Self-Government NOW!",
    "options": [
      "Self-Government NOW!",
      "Rivers of Blood",
      "Money back from Europe",
      "Do your duty in the Danelaw"
    ],
    "explanation": "The CPP’s radical demand helped push the Gold Coast towards independence as Ghana."
  },
  {
    "cardId": "notting-hill-carnival",
    "question": "Why did Notting Hill Carnival begin?",
    "correct": "As a response to racial tension that celebrated Caribbean culture and bridged divides",
    "options": [
      "As a response to racial tension that celebrated Caribbean culture and bridged divides",
      "As a protest against the East India Company’s rule in Bengal",
      "As a campaign to repeal the Corn Laws",
      "As a celebration of Britain joining the EEC"
    ],
    "explanation": "It grew from Claudia Jones’s indoor Caribbean carnival after the 1958 race riots into a major symbol of multicultural Britain."
  },
  {
    "cardId": "uccc",
    "question": "How did the UCCC lead towards Ghanaian independence?",
    "correct": "It began organised nationalist campaigning in the Gold Coast but was later seen as too moderate by Nkrumah",
    "options": [
      "It began organised nationalist campaigning in the Gold Coast but was later seen as too moderate by Nkrumah",
      "It gave police powers to stop and search suspected criminals",
      "It organised Caribbean migrants through the West Indian Gazette",
      "It negotiated the British rebate from European ministers"
    ],
    "explanation": "The UCCC brought Nkrumah into politics, but his split to form the CPP pushed demands further."
  },
  {
    "cardId": "racist-violence-nf-bnp-anti-racist-groups",
    "question": "What was one response to racist violence and far-right organising in the 1970s and 1980s?",
    "correct": "Anti-racist groups such as Rock Against Racism mobilised resistance",
    "options": [
      "Anti-racist groups such as Rock Against Racism mobilised resistance",
      "The East India Company was brought under government control",
      "The Mayflower Compact created democratic principles",
      "The Berlin Conference divided Africa among Europeans"
    ],
    "explanation": "Far-right protests and racist attacks were met by organised anti-racist campaigning and later legal and policing changes."
  },
  {
    "cardId": "expansion-of-the-european-union",
    "question": "What was a major migration effect of Britain’s EEC/EU membership?",
    "correct": "Free movement contributed to increased migration from Eastern Europe after 2004",
    "options": [
      "Free movement contributed to increased migration from Eastern Europe after 2004",
      "Convict transportation sent 160,000 prisoners to Australia",
      "Huguenot refugees brought silk weaving and watch-making skills",
      "Caribbean migrants arrived to rebuild post-war transport and health services"
    ],
    "explanation": "EU enlargement and free movement brought labour migration that became central to Brexit debates."
  },
  {
    "cardId": "eec-and-eu",
    "question": "Why did Britain join the EEC in 1973?",
    "correct": "To secure new trading partners after the loss of empire",
    "options": [
      "To secure new trading partners after the loss of empire",
      "To gain control of the Suez Canal route to India",
      "To create a Danelaw boundary with Viking settlers",
      "To abolish the East India Company after rebellion"
    ],
    "explanation": "EEC entry promised trade and market access, but later created arguments over sovereignty."
  },
  {
    "cardId": "ugandan-asian-immigration",
    "question": "What happened after Idi Amin expelled Asians from Uganda in 1972?",
    "correct": "Britain accepted thousands of refugees despite political and social opposition",
    "options": [
      "Britain accepted thousands of refugees despite political and social opposition",
      "Britain transported them as convicts to Australia",
      "They founded the Indian National Congress in Bengal",
      "They settled in New Plymouth under the Mayflower Compact"
    ],
    "explanation": "Ugandan Asian migration became a major example of refugee arrival and later successful integration in Britain."
  },
  {
    "cardId": "idi-amin",
    "question": "What action by Idi Amin directly caused Ugandan Asian migration to Britain?",
    "correct": "He expelled Asians from Uganda and gave many just 90 days to leave",
    "options": [
      "He expelled Asians from Uganda and gave many just 90 days to leave",
      "He founded the Convention People’s Party in the Gold Coast",
      "He led non-violent resistance against the British Raj",
      "He negotiated Britain’s rebate from the European Community"
    ],
    "explanation": "Amin’s 1972 decree forced around 28,000 Ugandan Asians to migrate to Britain as refugees."
  },
  {
    "cardId": "sus-laws",
    "question": "Why were the sus laws controversial?",
    "correct": "They were disproportionately used against Black youths and helped trigger the 1981 Brixton riots",
    "options": [
      "They were disproportionately used against Black youths and helped trigger the 1981 Brixton riots",
      "They gave the East India Company the right to collect taxes in Bengal",
      "They banned the transatlantic slave trade in 1807",
      "They allowed Puritans to settle New Plymouth"
    ],
    "explanation": "The laws created resentment because stop-and-search powers were used unevenly against Black communities."
  },
  {
    "cardId": "kenyan-independence",
    "question": "What happened in Kenya in 1963?",
    "correct": "Kenya gained independence from Britain after years of violence and negotiation",
    "options": [
      "Kenya gained independence from Britain after years of violence and negotiation",
      "Ghana became the first Black African colony to gain independence",
      "Britain joined the EEC to replace imperial trade links",
      "The Soviet Union collapsed and Eastern Europe moved towards the EU"
    ],
    "explanation": "Jomo Kenyatta became prime minister and later president, while Kenya became a republic in 1964."
  },
  {
    "cardId": "hola-detention-camp",
    "question": "Why did Hola Detention Camp damage British authority in Kenya?",
    "correct": "British officials beat eleven Mau Mau detainees to death, causing a scandal",
    "options": [
      "British officials beat eleven Mau Mau detainees to death, causing a scandal",
      "Rhodes’ associates failed to remove Paul Kruger by force",
      "Britain bought a stake in the Suez Canal to protect trade",
      "The Pilgrim Fathers agreed the Mayflower Compact"
    ],
    "explanation": "The deaths exposed colonial brutality and increased pressure for Kenyan independence."
  },
  {
    "cardId": "mau-mau",
    "question": "What was the Mau Mau rebellion?",
    "correct": "A violent anti-colonial rebellion in Kenya against white settler control of land",
    "options": [
      "A violent anti-colonial rebellion in Kenya against white settler control of land",
      "A non-violent boycott campaign led by Gandhi in India",
      "A Conservative campaign against Commonwealth immigration",
      "A political party created by Kwame Nkrumah in the Gold Coast"
    ],
    "explanation": "Britain’s brutal response showed that colonial rule in Kenya was becoming unsustainable."
  },
  {
    "cardId": "end-of-cold-war",
    "question": "How did the end of the Cold War affect migration to Britain?",
    "correct": "It opened the way for Eastern European countries to join the EU, leading to later migration",
    "options": [
      "It opened the way for Eastern European countries to join the EU, leading to later migration",
      "It led to the 1807 Act banning the slave trade",
      "It caused the loss of Normandy and baronial rebellion",
      "It created a permanent English colony at Jamestown"
    ],
    "explanation": "The collapse of Soviet influence helped reshape Europe, enabling later EU enlargement and migration."
  },
  {
    "cardId": "ethnic-minority-mps-1987",
    "question": "What was important about the 1987 election milestone for ethnic minority MPs?",
    "correct": "It gave immigrant communities a stronger parliamentary voice in modern Britain",
    "options": [
      "It gave immigrant communities a stronger parliamentary voice in modern Britain",
      "It created the first East India Company monopoly in Asia",
      "It ended British rule in India through partition",
      "It established the Pale around Dublin"
    ],
    "explanation": "The election of non-white MPs helped widen representation in Parliament."
  },
  {
    "cardId": "bernard-grant",
    "question": "Why is Bernard Grant significant in modern British politics?",
    "correct": "He was one of the first Black MPs and advocated for racial equality and migrant communities",
    "options": [
      "He was one of the first Black MPs and advocated for racial equality and migrant communities",
      "He was the dictator who expelled Asians from Uganda",
      "He led Britain during the Falklands War",
      "He founded the West Indian Gazette after moving to Britain"
    ],
    "explanation": "Grant’s career linked parliamentary representation with campaigns against institutional racism."
  },
  {
    "cardId": "margaret-thatcher",
    "question": "Which issue connects Margaret Thatcher to the migration and empire timeline?",
    "correct": "Her Falklands leadership and Euroscepticism shaped debates about sovereignty and Britain’s post-imperial role",
    "options": [
      "Her Falklands leadership and Euroscepticism shaped debates about sovereignty and Britain’s post-imperial role",
      "Her non-violent resistance forced Britain to grant Indian independence",
      "Her newspaper campaigned against the colour bar in housing",
      "Her party led the Gold Coast to independence"
    ],
    "explanation": "Thatcher’s period links remaining overseas territories, national pride and arguments over European integration."
  },
  {
    "cardId": "parliamentary-black-caucus",
    "question": "What was the purpose of the Parliamentary Black Caucus?",
    "correct": "To represent the interests of Britain’s ethnic minority communities in Parliament",
    "options": [
      "To represent the interests of Britain’s ethnic minority communities in Parliament",
      "To demand immediate British withdrawal from India",
      "To organise the first English colony in Virginia",
      "To control East India Company corruption in Bengal"
    ],
    "explanation": "Founded by Bernie Grant and other non-white MPs, it gave a focused political voice to minority communities."
  },
  {
    "cardId": "thatchers-pro-and-anti-eu-actions",
    "question": "What best captures Thatcher’s position on Europe?",
    "correct": "She supported the single market but opposed a centralised European superstate",
    "options": [
      "She supported the single market but opposed a centralised European superstate",
      "She opposed the single market but campaigned to adopt the Euro",
      "She led Britain into the EEC in 1973",
      "She organised EU enlargement in 2004 and 2007"
    ],
    "explanation": "Thatcher backed market integration but her Bruges speech warned against centralised European government."
  },
  {
    "cardId": "falklands-war-1982",
    "question": "Why did the Falklands War matter for Thatcher’s Britain?",
    "correct": "It boosted national pride and helped Thatcher win a landslide in 1983",
    "options": [
      "It boosted national pride and helped Thatcher win a landslide in 1983",
      "It forced Britain to withdraw from India and accept partition",
      "It led to the repeal of the 1784 India Act",
      "It created the first Black British weekly newspaper"
    ],
    "explanation": "The quick victory reinforced ideas of sovereignty and Britain’s defence of remaining overseas territories."
  },
  {
    "cardId": "european-union-expansion-2004-2007",
    "question": "What was the short-term migration impact of EU expansion in 2004/2007?",
    "correct": "Large-scale migration to Britain for work in sectors such as construction, retail and the NHS",
    "options": [
      "Large-scale migration to Britain for work in sectors such as construction, retail and the NHS",
      "The arrival of Caribbean migrants to rebuild post-war transport",
      "The movement of rural workers to Victorian factories and railways",
      "The recruitment of Indian indentured labourers to East Africa"
    ],
    "explanation": "EU enlargement admitted Eastern European countries and made free movement a major political issue in Britain."
  },
  {
    "cardId": "migration-from-eu-2004-2020",
    "question": "Why did EU migration become central to the 2016 referendum debate?",
    "correct": "Freedom of movement brought millions of EU citizens to Britain and became politically contested",
    "options": [
      "Freedom of movement brought millions of EU citizens to Britain and became politically contested",
      "The Mayflower Compact created democratic settlement in New Plymouth",
      "The Seven Years War created debt from defending colonies",
      "The Danelaw encouraged trade and intermarriage with Vikings"
    ],
    "explanation": "EU migration supplied labour but arguments over control of migration became central to Brexit."
  }
];
