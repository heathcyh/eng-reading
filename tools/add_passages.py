"""把新文章加進 content.json（id 已存在就覆蓋），並檢查：克漏字數量、翻譯句數、選項。
執行：python3 tools/add_passages.py"""
import json, os, re, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, "..", "content.json")

def split_sents(par):  # 與 app.js 的 splitSents 相同邏輯
    out, start = [], 0
    for m in re.finditer(r'[.!?]+["”]?(\s+|$)', par):
        end = m.end(); seg = par[start:end]
        if re.search(r'\b(Mr|Mrs|Ms|Dr)\.\s*$', seg): continue
        nxt = par[end:]
        if nxt and re.match(r'^[a-z]', nxt): continue
        out.append(seg); start = end
    if start < len(par) and par[start:].strip(): out.append(par[start:])
    merged = []
    for s in out:
        if merged and re.match(r"^\s*[A-Z][\w']*( [A-Z][\w']*)? (asks|says|said|asked|answered)\.\s*$", s): merged[-1] += s
        else: merged.append(s)
    return merged

def cl(*opts, exp=""): return {"opts": list(opts), "exp": exp}
def q(qq, *opts, exp=""): return {"q": qq, "opts": list(opts), "exp": exp}

NEW = [
# ───── 小五 ─────
{"id": "g5-4", "level": 5, "title": "A Day at the Beach", "zh": "海邊的一天",
 "text": "Last Sunday, my family {went} to the beach. The weather was hot and sunny. My dad and I swam in the sea. My sister made a sandcastle.\nAt noon, we ate sandwiches under a big umbrella. Then I found {some} pretty shells. I put them in my bag. In the evening, we watched the sun go down. The sky was orange and red. I was tired, {but} I was very happy. I {want} to go there again.",
 "cloze": [cl("went", "go", "goes", "going", exp="Last Sunday 是過去時間，用過去式 went。"),
           cl("some", "a", "any", "much", exp="肯定句、可數複數 shells 用 some。"),
           cl("but", "so", "or", "because", exp="累了「但是」很開心，前後語意轉折用 but。"),
           cl("want", "wants", "wanted to", "wanting", exp="主詞 I，後面接 to go，用 want。")],
 "qs": [q("What did the writer's sister do at the beach?", "She made a sandcastle.", "She swam in the sea.", "She found shells.", "She ate pizza.", exp="My sister made a sandcastle."),
        q("Where did they eat lunch?", "Under a big umbrella.", "In a restaurant.", "In the car.", "In the sea.", exp="we ate sandwiches under a big umbrella."),
        q("How did the writer feel at the end of the day?", "Tired but happy.", "Sad and angry.", "Bored.", "Sick.", exp="I was tired, but I was very happy.")],
 "tr": ["上星期日，我們全家去海邊。", "天氣又熱又晴朗。", "爸爸和我在海裡游泳。", "我妹妹堆了一座沙堡。",
        "中午，我們在一把大陽傘下吃三明治。", "然後我找到一些漂亮的貝殼。", "我把它們放進我的包包。", "傍晚，我們看著太陽下山。", "天空是橘色和紅色的。", "我很累，但是很開心。", "我想要再去那裡。"],
 "dict": {"sandcastle": "n. 沙堡", "shells": "n. 貝殼（複數）", "umbrella": "n. 傘", "noon": "n. 中午"}},
{"id": "g5-5", "level": 5, "title": "My Pet Rabbit", "zh": "我的寵物兔",
 "text": "I have a pet rabbit. Her name is Snowy. She is white and has long ears. She is very {cute}.\nEvery morning, I give Snowy carrots and water. She likes carrots very much. After school, I play with her in the living room. She can jump very {high}. On weekends, I clean her house. My mom {helps} me. Snowy is my best friend. I love her a {lot}.",
 "cloze": [cl("cute", "cuter", "cutely", "cuteness", exp="be 動詞 is 後面接形容詞 cute。"),
           cl("high", "tall", "long", "big", exp="跳得很高：jump high。"),
           cl("helps", "help", "helping", "to help", exp="主詞 My mom 是第三人稱單數，用 helps。"),
           cl("lot", "many", "much of", "lots", exp="I love her a lot. 我非常愛她。")],
 "qs": [q("What color is Snowy?", "White.", "Brown.", "Black.", "Gray.", exp="She is white and has long ears."),
        q("What does Snowy like to eat?", "Carrots.", "Apples.", "Fish.", "Rice.", exp="She likes carrots very much."),
        q("Who helps the writer clean Snowy's house?", "The writer's mom.", "The writer's dad.", "The writer's sister.", "A friend.", exp="My mom helps me.")],
 "tr": ["我有一隻寵物兔。", "她的名字叫小雪。", "她是白色的，有長長的耳朵。", "她非常可愛。",
        "每天早上，我給小雪紅蘿蔔和水。", "她非常喜歡紅蘿蔔。", "放學後，我在客廳和她玩。", "她可以跳得很高。", "週末時，我會清理她的家。", "我媽媽會幫我。", "小雪是我最好的朋友。", "我非常愛她。"],
 "dict": {"rabbit": "n. 兔子", "carrots": "n. 紅蘿蔔（複數）", "jump": "v. 跳"}},
# ───── 小六 ─────
{"id": "g6-4", "level": 6, "title": "Sports Day", "zh": "運動會",
 "text": "Last Wednesday was Sports Day at our school. All the students wore their sports clothes and sat on the playground. The principal gave a short speech, and then the games began.\nMy class was in the relay race. I was the last runner, so I felt very {nervous}. When my classmate gave me the stick, our team was in third place. I ran as fast as I {could}. Everyone shouted my name. At the end, I passed one runner, and we got second place!\nOur teacher {was} very proud of us. After the race, we drank cold water and took a class photo. It was a day I will never {forget}.",
 "cloze": [cl("nervous", "happy", "hungry", "lazy", exp="最後一棒壓力很大，所以「緊張」nervous。"),
           cl("could", "can", "will", "should", exp="as fast as I could 盡我所能地快；過去式用 could。"),
           cl("was", "were", "is", "be", exp="主詞 Our teacher 單數，過去時間用 was。"),
           cl("forget", "forgot", "forgets", "forgetting", exp="will 後面接原形動詞 forget。")],
 "qs": [q("Which race was the writer's class in?", "The relay race.", "The long jump.", "The swimming race.", "The bike race.", exp="My class was in the relay race."),
        q("Why did the writer feel nervous?", "Because the writer was the last runner.", "Because it was raining.", "Because the writer was sick.", "Because the writer lost the stick.", exp="I was the last runner, so I felt very nervous."),
        q("What place did the team get in the end?", "Second place.", "First place.", "Third place.", "Last place.", exp="we got second place!"),
        q("What did the class do after the race?", "They drank cold water and took a photo.", "They went home.", "They ate ice cream.", "They had another race.", exp="we drank cold water and took a class photo.")],
 "tr": ["上星期三是我們學校的運動會。", "所有學生都穿著運動服，坐在操場上。", "校長發表了簡短的演說，然後比賽開始了。",
        "我們班參加大隊接力。", "我是最後一棒，所以我覺得非常緊張。", "當同學把接力棒交給我時，我們隊是第三名。", "我盡全力跑得最快。", "大家都喊著我的名字。", "最後，我超越了一位跑者，我們得到第二名！",
        "我們老師非常以我們為榮。", "比賽結束後，我們喝了冰水，拍了一張班級合照。", "這是我永遠不會忘記的一天。"],
 "dict": {"principal": "n. 校長", "speech": "n. 演講", "relay": "n. 接力", "nervous": "adj. 緊張的", "proud": "adj. 驕傲的", "stick": "n. 棒子"}},
{"id": "g6-5", "level": 6, "title": "Making Dumplings", "zh": "包水餃",
 "text": "Every year before Chinese New Year, my family makes dumplings together. This year, my grandma taught me {how} to make them.\nFirst, we mixed pork, cabbage, and green onions in a big bowl. Then Grandma showed me how to put the meat in the middle of the dumpling skin and close it. My first dumpling looked {like} a small ball, and everyone laughed. I tried again and again. After thirty minutes, my dumplings looked much {better}.\nWe made more than one hundred dumplings. We boiled some for dinner and put the rest in the freezer. They were delicious. Grandma said I did a good job, and I felt very {proud}.",
 "cloze": [cl("how", "what", "where", "why", exp="how to + 原形動詞：如何做…。"),
           cl("like", "at", "as", "for", exp="look like + 名詞：看起來像…。"),
           cl("better", "good", "best", "well", exp="much 修飾比較級：much better 好多了。"),
           cl("proud", "angry", "afraid", "bored", exp="被稱讚後覺得驕傲 proud。")],
 "qs": [q("Who taught the writer to make dumplings?", "The writer's grandma.", "The writer's teacher.", "The writer's dad.", "A cook.", exp="my grandma taught me how to make them."),
        q("Why did everyone laugh?", "The writer's first dumpling looked like a small ball.", "The writer dropped the bowl.", "Grandma told a joke.", "The dumplings were too salty.", exp="My first dumpling looked like a small ball, and everyone laughed."),
        q("What did they do with the dumplings they didn't eat?", "They put them in the freezer.", "They gave them to neighbors.", "They threw them away.", "They sold them.", exp="put the rest in the freezer."),
        q("Which is NOT in the dumplings?", "Beef.", "Pork.", "Cabbage.", "Green onions.", exp="內餡是 pork, cabbage, green onions，沒有 beef。")],
 "tr": ["每年過年前，我們家都會一起包水餃。", "今年，奶奶教我怎麼包。",
        "首先，我們在一個大碗裡把豬肉、高麗菜和蔥拌在一起。", "接著奶奶示範怎麼把肉放在水餃皮中間再包起來。", "我包的第一顆水餃看起來像一顆小球，大家都笑了。", "我試了一次又一次。", "三十分鐘後，我的水餃看起來好多了。",
        "我們包了一百多顆水餃。", "我們煮了一些當晚餐，剩下的放進冷凍庫。", "它們很好吃。", "奶奶說我做得很好，我覺得非常驕傲。"],
 "dict": {"dumplings": "n. 水餃（複數）", "pork": "n. 豬肉", "cabbage": "n. 高麗菜", "freezer": "n. 冷凍庫", "boiled": "v. 煮（boil 的過去式）", "skin": "n. 皮"}},
# ───── 國一 ─────
{"id": "g7-4", "level": 7, "title": "Helping at the Library", "zh": "在圖書館幫忙",
 "text": "This semester, I joined the library helpers' club at school. Every Tuesday and Thursday, I spend my lunch break in the library. My job is to put the returned books back on the {right} shelves.\nAt first, it was not easy. There are thousands of books in our library, and each book has a number on it. I had to learn how the numbers {work}. Ms. Lin, our librarian, was very patient. She explained everything to me again and again.\nNow I can find any book in less {than} a minute. Last week, a seventh grader was looking for a book about dinosaurs, and I helped her find it. She said thank you with a big smile. That made me feel {useful}.\nBeing a library helper takes time, {but} I have learned a lot. I also read more books than before, {because} I always see interesting new titles on the shelves.",
 "cloze": [cl("right", "wrong", "high", "empty", exp="把書放回「正確的」書架：the right shelves。"),
           cl("work", "works", "worked", "working", exp="間接問句 how the numbers work，主詞 numbers 複數用 work。"),
           cl("than", "then", "that", "as", exp="less than a minute 不到一分鐘。"),
           cl("useful", "useless", "bored", "lonely", exp="幫助別人讓我覺得自己「有用」。"),
           cl("but", "so", "or", "if", exp="花時間「但是」學到很多，語意轉折。"),
           cl("because", "although", "until", "unless", exp="讀更多書的原因：因為常看到有趣的新書。")],
 "qs": [q("When does the writer help in the library?", "During lunch break on Tuesdays and Thursdays.", "Every morning before class.", "After school on Fridays.", "On weekends.", exp="Every Tuesday and Thursday, I spend my lunch break in the library."),
        q("Who is Ms. Lin?", "The school librarian.", "The writer's English teacher.", "A seventh grader.", "The writer's mother.", exp="Ms. Lin, our librarian, was very patient."),
        q("What was hard for the writer at first?", "Learning how the book numbers work.", "Carrying heavy books.", "Reading English books.", "Using the computer.", exp="each book has a number on it. I had to learn how the numbers work."),
        q("What is one good thing the writer got from the job?", "The writer reads more books than before.", "The writer gets money.", "The writer has more free time.", "The writer can take books home for free.", exp="I also read more books than before.")],
 "tr": ["這學期，我參加了學校的圖書館小幫手社。", "每週二和週四，我都在圖書館度過午休。", "我的工作是把歸還的書放回正確的書架上。",
        "一開始，這並不容易。", "我們圖書館有好幾千本書，每本書上都有一個編號。", "我必須學會這些編號是怎麼運作的。", "我們的圖書館員林老師非常有耐心。", "她一次又一次地向我解釋每件事。",
        "現在我可以在一分鐘內找到任何一本書。", "上星期，一位七年級生在找一本關於恐龍的書，我幫她找到了。", "她帶著大大的笑容向我道謝。", "那讓我覺得自己很有用。",
        "當圖書館小幫手要花時間，但我學到了很多。", "我也比以前讀更多書，因為我總是在書架上看到有趣的新書。"],
 "dict": {"semester": "n. 學期", "librarian": "n. 圖書館員", "shelves": "n. 書架（shelf 的複數）", "patient": "adj. 有耐心的", "returned": "adj. 歸還的", "dinosaurs": "n. 恐龍（複數）", "titles": "n. 書名（複數）", "useful": "adj. 有用的"}},
{"id": "g7-5", "level": 7, "title": "Grandpa's New Smartphone", "zh": "爺爺的新手機",
 "text": "Last month, my grandpa got his first smartphone. He was excited, but he didn't know how to use it. He asked me to {teach} him.\nFirst, I showed him how to make video calls. Now he calls my aunt in Kaohsiung every evening. He can see her face and talk to her for a long time. Next, I taught him how to take photos. He likes taking pictures of the flowers in his garden. Sometimes he takes {too} many pictures, and his phone gets full.\nThe {hardest} part was typing. Grandpa's fingers are big, and the keys on the screen are small. So I showed him how to send voice messages {instead}. Now he sends me voice messages every day. He usually says, \"Eat more and study hard!\"\nTeaching Grandpa was fun. I learned that older people can learn new things, {too}. They just need more time and someone who is {patient}.",
 "cloze": [cl("teach", "teaches", "taught", "teaching", exp="ask sb. to + 原形動詞：要求某人去做…。"),
           cl("too", "to", "two", "very", exp="too many 太多。"),
           cl("hardest", "harder", "hard", "hardly", exp="the + 最高級：最難的部分。"),
           cl("instead", "again", "already", "together", exp="改用語音訊息「代替」打字：instead。"),
           cl("too", "either", "also", "neither", exp="肯定句句尾的「也」用 too。"),
           cl("patient", "busy", "angry", "careless", exp="需要一個「有耐心的」人教他們。")],
 "qs": [q("Who does Grandpa call every evening?", "The writer's aunt.", "The writer's teacher.", "His old friend.", "The writer.", exp="he calls my aunt in Kaohsiung every evening."),
        q("Why does Grandpa's phone get full?", "He takes too many pictures.", "He downloads many games.", "He watches many videos.", "He gets too many messages.", exp="Sometimes he takes too many pictures, and his phone gets full."),
        q("Why does Grandpa send voice messages?", "Typing on the small screen is hard for him.", "He can't see the screen.", "Voice messages are cheaper.", "The writer can't read.", exp="Grandpa's fingers are big, and the keys on the screen are small."),
        q("What did the writer learn?", "Older people can learn new things, too.", "Smartphones are bad for older people.", "Grandpa doesn't like technology.", "Typing is easy for everyone.", exp="I learned that older people can learn new things, too.")],
 "tr": ["上個月，我爺爺買了他的第一支智慧型手機。", "他很興奮，但不知道怎麼使用。", "他請我教他。",
        "首先，我教他怎麼視訊通話。", "現在他每天傍晚都打給在高雄的姑姑。", "他可以看到她的臉，和她聊很久。", "接著，我教他怎麼拍照。", "他喜歡拍他花園裡的花。", "有時候他拍太多照片，手機就滿了。",
        "最難的部分是打字。", "爺爺的手指很粗，螢幕上的按鍵卻很小。", "所以我教他改傳語音訊息。", "現在他每天都傳語音訊息給我。", "他通常會說：「多吃一點，要用功讀書！」",
        "教爺爺很有趣。", "我學到年長的人也能學新東西。", "他們只是需要多一點時間，以及一個有耐心的人。"],
 "dict": {"smartphone": "n. 智慧型手機", "typing": "n. 打字", "screen": "n. 螢幕", "voice": "n. 聲音", "messages": "n. 訊息（複數）", "fingers": "n. 手指（複數）", "keys": "n. 按鍵（複數）", "instead": "adv. 作為替代", "Kaohsiung": "n. 高雄"}},
# ───── 國二 ─────
{"id": "g8-4", "level": 8, "title": "Our Class Garden", "zh": "我們的班級菜園",
 "text": "At the beginning of the school year, our teacher, Mr. Huang, gave our class a small piece of land behind the school building. \"Let's grow our own vegetables,\" he said. Most of us had never planted {anything} before, so we were both excited and worried.\nWe divided the class into four groups. Each group was {in} charge of one kind of vegetable: lettuce, tomatoes, sweet potatoes, or green beans. My group chose tomatoes. We watered them every morning and pulled out weeds after school.\nThings did not always go well. In October, a strong typhoon broke many of our tomato plants. Some classmates wanted to give up, but Mr. Huang told us that {failure} is part of farming. We tied the broken plants to sticks and planted new seeds.\nTwo months later, our hard work finally paid off. The tomatoes turned red, and the sweet potato group dug up a whole basket of sweet potatoes. We {used} our vegetables to make a big salad and sweet potato soup for the whole class.\nThe garden taught us many things. We learned how much work goes into the food on our tables. We also learned to work {together} and not to give up easily. {Since} then, I have never left vegetables on my plate. Now I know how {valuable} they are.",
 "cloze": [cl("anything", "something", "nothing", "everything", exp="否定意味（had never）的句子用 anything。"),
           cl("in", "on", "at", "for", exp="be in charge of 負責…。"),
           cl("failure", "success", "money", "weather", exp="老師說「失敗」是種植的一部分。"),
           cl("used", "use", "were used", "using", exp="主動語態、過去時間：We used...。"),
           cl("together", "alone", "slowly", "quietly", exp="work together 合作。"),
           cl("Since", "Before", "Until", "Unless", exp="Since then + 現在完成式：從那時起。"),
           cl("valuable", "cheap", "terrible", "useless", exp="知道蔬菜多「珍貴」。")],
 "qs": [q("Which vegetable did the writer's group grow?", "Tomatoes.", "Lettuce.", "Sweet potatoes.", "Green beans.", exp="My group chose tomatoes."),
        q("What happened in October?", "A typhoon broke many tomato plants.", "The class won a prize.", "The vegetables were stolen.", "Mr. Huang left the school.", exp="In October, a strong typhoon broke many of our tomato plants."),
        q("What does \"paid off\" mean in the fourth paragraph?", "Their hard work brought good results.", "They paid money for seeds.", "They sold the vegetables.", "They stopped working.", exp="pay off 指努力有了成果。"),
        q("How has the writer changed after the garden project?", "The writer doesn't leave vegetables on the plate anymore.", "The writer wants to be a farmer.", "The writer stopped eating tomatoes.", "The writer never waters plants.", exp="Since then, I have never left vegetables on my plate.")],
 "tr": ["學年一開始，我們的老師黃老師給了我們班教學大樓後面的一小塊地。", "他說：「我們來種自己的蔬菜吧。」", "我們大部分的人以前從沒種過任何東西，所以既興奮又擔心。",
        "我們把全班分成四組。", "每組負責一種蔬菜：萵苣、番茄、地瓜或四季豆。", "我這組選了番茄。", "我們每天早上澆水，放學後拔雜草。",
        "事情並不總是順利。", "十月時，一個強烈颱風吹斷了我們很多番茄株。", "有些同學想放棄，但黃老師告訴我們，失敗是種植的一部分。", "我們把折斷的植株綁在棍子上，並種下新的種子。",
        "兩個月後，我們的努力終於有了成果。", "番茄變紅了，地瓜組挖出了一整籃地瓜。", "我們用自己的蔬菜為全班做了一大盤沙拉和地瓜湯。",
        "這個菜園教了我們很多事。", "我們學到餐桌上的食物要花多少功夫。", "我們也學會合作、不輕易放棄。", "從那之後，我再也沒有把蔬菜剩在盤子裡。", "現在我知道它們有多珍貴。"],
 "dict": {"lettuce": "n. 萵苣", "weeds": "n. 雜草（複數）", "typhoon": "n. 颱風", "failure": "n. 失敗", "farming": "n. 農耕", "seeds": "n. 種子（複數）", "valuable": "adj. 珍貴的", "divided": "v. 分開（divide 的過去式）", "charge": "n. 負責、掌管"}},
{"id": "g8-5", "level": 8, "title": "A Typhoon Day Off", "zh": "颱風假",
 "text": "Last night, the news said that a strong typhoon was coming, and schools would be closed today. My little brother jumped up and down {with} joy. \"No school tomorrow!\" he shouted. But my parents were busy. They moved the plants inside, closed all the windows, and bought enough food and water.\nThis morning, the wind was so strong that the trees outside our building were shaking. Heavy rain hit the windows. At about ten o'clock, the power {went} out. Without electricity, we could not watch TV or use the computer. My brother looked bored. \"What should we do now?\" he asked.\nMy mom took out an old board game, and we played it together {by} candlelight. My dad told us stories about typhoons when he was a child. He said that his house was once flooded, and he had to stay at his aunt's home for a week. We listened carefully. It was the first time I had heard these stories.\nIn the afternoon, the power came back. My brother ran to turn on the TV, but I felt a little {disappointed}. The day without electricity was actually fun. A typhoon can be {dangerous}, but this one gave our family a special day. Next time, I hope we can spend time together like this {even} without a typhoon. Of course, I also hope that everyone stays {safe}.",
 "cloze": [cl("with", "for", "at", "of", exp="jump with joy 高興得跳起來。"),
           cl("went", "came", "turned", "made", exp="the power went out 停電了。"),
           cl("by", "in", "on", "with", exp="by candlelight 在燭光下。"),
           cl("disappointed", "excited", "relaxed", "surprised", exp="停電好玩，電來了反而有點「失望」。"),
           cl("dangerous", "safe", "boring", "cheap", exp="颱風可能很「危險」，但…（轉折）。"),
           cl("even", "only", "never", "still", exp="even without a typhoon 即使沒有颱風也…。"),
           cl("safe", "safely", "safety", "save", exp="stay + 形容詞：stay safe 保持平安。")],
 "qs": [q("What did the writer's parents do before the typhoon came?", "They moved plants inside and bought food and water.", "They went to the beach.", "They took the children to school.", "They fixed the TV.", exp="They moved the plants inside, closed all the windows, and bought enough food and water."),
        q("Why couldn't the family watch TV in the morning?", "The power went out.", "The TV was broken.", "Their mom didn't allow it.", "There was no typhoon news.", exp="the power went out. Without electricity, we could not watch TV."),
        q("What happened to the father when he was a child?", "His house was flooded.", "He lost his dog.", "He broke his leg.", "He moved to another country.", exp="his house was once flooded, and he had to stay at his aunt's home for a week."),
        q("How did the writer feel about the day?", "It was special and fun for the family.", "It was the worst day ever.", "It was boring and scary.", "It was too short to enjoy.", exp="The day without electricity was actually fun... this one gave our family a special day.")],
 "tr": ["昨晚新聞說有一個強烈颱風要來，今天學校停課。", "我弟弟高興得跳上跳下。", "他大喊：「明天不用上學！」", "但我爸媽很忙。", "他們把植物搬進屋裡，關上所有窗戶，並買了足夠的食物和水。",
        "今天早上，風大到我們大樓外面的樹都在搖晃。", "大雨打在窗戶上。", "大約十點時，停電了。", "沒有電，我們不能看電視，也不能用電腦。", "我弟弟看起來很無聊。", "他問：「我們現在要做什麼？」",
        "媽媽拿出一個舊的桌遊，我們在燭光下一起玩。", "爸爸告訴我們他小時候遇到颱風的故事。", "他說他家曾經淹水，他得在姑姑家住一個星期。", "我們仔細地聽。", "那是我第一次聽到這些故事。",
        "下午，電來了。", "我弟弟跑去打開電視，但我覺得有點失望。", "沒有電的這一天其實很好玩。", "颱風可能很危險，但這個颱風給了我們家特別的一天。", "下一次，我希望即使沒有颱風，我們也能像這樣一起相處。", "當然，我也希望大家都平安。"],
 "dict": {"typhoon": "n. 颱風", "electricity": "n. 電", "candlelight": "n. 燭光", "flooded": "adj. 淹水的", "disappointed": "adj. 失望的", "dangerous": "adj. 危險的", "power": "n. 電力", "joy": "n. 喜悅", "shaking": "v. 搖晃（shake 的 -ing）"}},
# ───── 國三 ─────
{"id": "g9-4", "level": 9, "title": "The Hidden Cost of Cheap Clothes", "zh": "便宜衣服的隱藏代價",
 "text": "Many teenagers love shopping for clothes. Thanks to \"fast fashion\" brands, it is now possible to buy a T-shirt for less than the price of a lunch box. These stores bring out new styles every week, so shoppers always feel that they {need} something new. But have you ever wondered why these clothes are so cheap?\nThe answer is not simple. To keep prices low, many companies make their clothes in factories where workers are paid very little. Some of these workers work more than twelve hours a day. In {addition}, making clothes uses a lot of water. It can take about 2,700 liters of water to make just one cotton T-shirt. That is {enough} water for one person to drink for over two years.\nThe problem does not end after we buy the clothes. Because cheap clothes are often poorly made, they {wear} out quickly. Many people throw them away after wearing them only a few times. Every year, millions of tons of clothes end up in landfills, {where} they may take hundreds of years to break down.\nSo what can we do? First, think twice before buying. Ask {yourself} whether you really need it. Second, take good care of your clothes so that they last longer. Third, give clothes that you no longer wear to others, or buy second-hand clothes. {Although} these actions seem small, they can make a big difference if many people do them. The next time you see a cheap T-shirt, remember that someone, {somewhere}, may be paying the real price.",
 "cloze": [cl("need", "needs", "needed to", "needing", exp="主詞 they 複數，現在式用 need。"),
           cl("addition", "fact", "case", "general", exp="In addition 此外（補充另一個問題）。"),
           cl("enough", "too", "very", "such", exp="enough + 名詞 + for...：足夠…的水。"),
           cl("wear", "put", "take", "give", exp="wear out 穿壞、磨損。"),
           cl("where", "which", "when", "who", exp="關係副詞 where 修飾地點 landfills。"),
           cl("yourself", "you", "your", "yours", exp="Ask yourself 問問你自己（反身代名詞）。"),
           cl("Although", "Because", "Unless", "If", exp="雖然這些行動看似微小，但…（讓步）。"),
           cl("somewhere", "anywhere", "nowhere", "everywhere", exp="someone, somewhere 某處的某個人。")],
 "qs": [q("What is the main idea of the passage?", "Cheap fast-fashion clothes have hidden costs for people and the environment.", "Fast fashion helps teenagers save money.", "Cotton T-shirts are the best clothes to buy.", "Factories should make more clothes every week.", exp="全文說明便宜衣服背後的勞工、用水與垃圾問題，以及我們能做的事。"),
        q("According to the passage, how much water may it take to make one cotton T-shirt?", "About 2,700 liters.", "About 270 liters.", "About 27 liters.", "About 27,000 liters.", exp="It can take about 2,700 liters of water to make just one cotton T-shirt."),
        q("Why do cheap clothes often end up in landfills quickly?", "They are poorly made and wear out fast.", "They are too expensive to keep.", "Landfills pay people for clothes.", "They are made of plastic.", exp="Because cheap clothes are often poorly made, they wear out quickly."),
        q("Which is NOT one of the writer's suggestions?", "Buy new clothes every week.", "Think twice before buying.", "Take good care of your clothes.", "Buy second-hand clothes.", exp="作者建議三思、愛惜衣物、轉送或買二手；每週買新衣是相反的行為。")],
 "tr": ["很多青少年喜歡買衣服。", "多虧了「快時尚」品牌，現在用不到一個便當的價格就能買到一件T恤。", "這些店每週推出新款式，所以購物者總覺得自己需要新東西。", "但你是否想過，為什麼這些衣服這麼便宜？",
        "答案並不簡單。", "為了壓低價格，許多公司在工資很低的工廠生產衣服。", "其中有些工人一天工作超過十二小時。", "此外，製作衣服要用掉大量的水。", "光是做一件棉T恤，就可能需要大約2,700公升的水。", "那足夠一個人喝超過兩年。",
        "問題在我們買下衣服後並沒有結束。", "因為便宜衣服常常做工粗糙，很快就穿壞了。", "很多人只穿幾次就把它們丟掉。", "每年有數百萬噸的衣服最後進了掩埋場，在那裡它們可能要花幾百年才能分解。",
        "那我們能做什麼呢？", "第一，購買前三思。", "問問自己是不是真的需要。", "第二，好好愛惜衣服，讓它們穿得更久。", "第三，把不再穿的衣服送給別人，或購買二手衣。", "雖然這些行動看似微小，但如果很多人一起做，就能帶來很大的改變。", "下次你看到便宜的T恤時，記得某個地方的某個人，可能正在付出真正的代價。"],
 "dict": {"fashion": "n. 時尚", "brands": "n. 品牌（複數）", "factories": "n. 工廠（複數）", "liters": "n. 公升（複數）", "cotton": "n. 棉", "landfills": "n. 掩埋場（複數）", "second-hand": "adj. 二手的", "wondered": "v. 想知道（wonder 的過去分詞）", "tons": "n. 噸（複數）", "hidden": "adj. 隱藏的", "cost": "n. 代價；成本"}},
{"id": "g9-5", "level": 9, "title": "A Summer at the Animal Shelter", "zh": "在動物收容所的暑假",
 "text": "Last summer, I volunteered at an animal shelter near my home. Before that, I had never taken care of a pet, so I didn't know what to {expect}. On my first day, the manager, Ms. Chou, showed me around. There were more than sixty dogs and thirty cats, and most of them had been abandoned by their owners.\nMy job was to clean the cages, give the animals food and water, and walk the dogs. It was hard work, especially on hot afternoons. {However}, the moment I opened the cages, the dogs would run to me and wag their tails. That always made me forget how tired I was.\nOne dog, a black puppy named Lucky, was very shy. He hid in the corner {whenever} someone came near. Ms. Chou told me that Lucky had been hurt by his former owner. I decided to spend ten minutes with him every day. I didn't try to touch him at first. I just sat quietly and talked to him. After about three weeks, Lucky finally came over and put his head on my leg. I was so {moved} that I almost cried.\nAt the end of the summer, a young couple {adopted} Lucky. I was sad to say goodbye, but I knew he would have a warm home. This experience taught me that pets are not toys. They are living things that need love and {responsibility}. Before people decide to get a pet, they should think carefully. {Instead} of buying one, they can also consider adopting an animal from a shelter. As the shelter's poster says, \"Adopt, don't shop.\"",
 "cloze": [cl("expect", "expects", "expected", "expecting", exp="what to + 原形動詞：不知道會遇到什麼。"),
           cl("However", "Therefore", "Besides", "Otherwise", exp="工作很辛苦；「然而」狗狗跑來就忘了累。"),
           cl("whenever", "unless", "although", "so that", exp="每當有人靠近就躲起來：whenever。"),
           cl("moved", "moving", "bored", "boring", exp="人「感到」感動用 -ed 形容詞 moved。"),
           cl("adopted", "adopting", "was adopted", "adopts", exp="主詞 a young couple 主動領養，過去式 adopted。"),
           cl("responsibility", "money", "toys", "noise", exp="寵物需要愛與「責任」。"),
           cl("Instead", "Because", "In spite", "Out", exp="Instead of + V-ing：不…而是…。")],
 "qs": [q("Why were most of the animals at the shelter?", "Their owners had abandoned them.", "They were born there.", "They were sick.", "They were waiting to be sold.", exp="most of them had been abandoned by their owners."),
        q("Why was Lucky shy?", "He had been hurt by his former owner.", "He was too young.", "He didn't like other dogs.", "He was very sick.", exp="Lucky had been hurt by his former owner."),
        q("How did the writer help Lucky become less shy?", "By sitting quietly with him every day.", "By giving him lots of toys.", "By taking him home.", "By making him play with other dogs.", exp="I decided to spend ten minutes with him every day... I just sat quietly and talked to him."),
        q("What does \"Adopt, don't shop\" mean?", "Get a pet from a shelter instead of buying one.", "Don't go shopping with your pets.", "Shelters sell animals at low prices.", "Only buy pets from good shops.", exp="呼應前一句：與其買寵物，不如領養收容所的動物。")],
 "tr": ["去年暑假，我在家附近的動物收容所當志工。", "在那之前，我從來沒有照顧過寵物，所以不知道會遇到什麼。", "第一天，負責人周小姐帶我四處參觀。", "那裡有超過六十隻狗和三十隻貓，牠們大部分都曾被飼主拋棄。",
        "我的工作是清理籠子、給動物食物和水，還有遛狗。", "這是辛苦的工作，尤其是在炎熱的下午。", "然而，我一打開籠子，狗狗們就會跑向我、搖著尾巴。", "那總讓我忘記自己有多累。",
        "有一隻叫幸運的黑色小狗非常害羞。", "每當有人靠近，他就躲在角落。", "周小姐告訴我，幸運曾被前飼主傷害。", "我決定每天陪他十分鐘。", "一開始我沒有試著摸他。", "我只是安靜地坐著和他說話。", "大約三週後，幸運終於走過來，把頭靠在我的腿上。", "我感動得差點哭出來。",
        "暑假結束時，一對年輕夫妻領養了幸運。", "要說再見讓我很難過，但我知道他會有一個溫暖的家。", "這次經驗讓我明白寵物不是玩具。", "牠們是需要愛與責任的生命。", "人們決定養寵物前，應該仔細考慮。", "與其用買的，他們也可以考慮從收容所領養動物。", "就像收容所海報上說的：「以領養代替購買。」"],
 "dict": {"shelter": "n. 收容所", "volunteered": "v. 當志工（volunteer 的過去式）", "abandoned": "v. 拋棄（abandon 的過去分詞）", "cages": "n. 籠子（複數）", "wag": "v. 搖（尾巴）", "puppy": "n. 小狗", "former": "adj. 以前的", "adopted": "v. 領養（adopt 的過去式）", "adopt": "v. 領養", "responsibility": "n. 責任", "manager": "n. 經理；負責人", "couple": "n. 夫妻；一對", "poster": "n. 海報", "moved": "adj. 感動的"}},
]

c = json.load(open(P, encoding="utf-8"))
m = {p["id"]: p for p in c["passages"]}
for p in NEW:
    blanks = re.findall(r"\{[^}]+\}", p["text"])
    assert len(blanks) == len(p["cloze"]), (p["id"], len(blanks), len(p["cloze"]))
    for b, cz in zip(blanks, p["cloze"]):
        assert b[1:-1] == cz["opts"][0], (p["id"], b, cz["opts"][0])
        assert len(set(cz["opts"])) == len(cz["opts"]) == 4, (p["id"], cz)
    for qq in p["qs"]: assert len(set(qq["opts"])) == 4, (p["id"], qq["q"])
    n = sum(len(split_sents(par)) for par in p["text"].split("\n"))
    assert n == len(p["tr"]), (p["id"], "sentences", n, "tr", len(p["tr"]), [s for par in p["text"].split("\n") for s in split_sents(par)])
    m[p["id"]] = p
c["passages"] = sorted(m.values(), key=lambda p: (p["level"], int(p["id"].split("-")[1])))
c["version"] = c.get("version", 0) + 1
c["updated"] = datetime.date.today().isoformat()
json.dump(c, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(c["passages"]), "version", c["version"])
