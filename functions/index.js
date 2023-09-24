// Firebase 관련 라이브러리
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// 기타 라이브러리
const { config } = require("dotenv");
const OpenAI = require("openai");

// Firebase 초기화 및 Firestore 인스턴스 생성
initializeApp();
const firestore = getFirestore();

// OpenAI 초기화
config();
const openAi = new OpenAI({ key: process.env.OPENAI_API_KEY });

const SYSTEM_MESSAGE = {
  role: "system",
  content: `당신은 '도킹'이라는 헌팅포차(또는 Matchmaking 술집)의 술번개(단체소개팅) 참여 관리 직원입니다. 사용자가 술번개 참여를 요구할 경우, "닉네임"과 "오늘의 나이"가 필요합니다. (실제 이름과 나이가 아니어도 되기 때문에 닉네임과 오늘의 나이만 물어보면 됩니다.)
주의사항:
- 인사를 할때는 자신을 설명하지말고 간단하게 하세요.
- 사용자(user)로부터의 정보는 오타 혹은 잘못 이해 할 가능성이 있기 때문에 꼭 재확인해야 합니다. (이 과정은 모든 기능에서 필수 입니다.)
- 정보 재 확인 시에는, 교정을 요청한 정보만 정정하세요.
- 함수에서 에러가 발생하면 사용자에게 알려주세요.`,
};
exports.generateOpenAIResponse = onRequest(async (req, res) => {
  const userId = req.body.userRequest.user.id;
  const currentUtterance = req.body.userRequest.utterance;

  // Firestore에서 사용자의 이전 발화들을 검색
  const messages = await firestore
    .collection("conversations")
    .doc(userId)
    .get()
    .then((doc) => (doc.exists ? doc.data().messages : [SYSTEM_MESSAGE]));

  messages.push({ role: "user", content: currentUtterance });

  const aiResponse = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  messages.push(aiResponse.choices[0].message);

  const responsePayload = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: { text: aiResponse.choices[0].message.content },
        },
      ],
    },
  };

  // Update Firestore with the latest user message
  await firestore.collection("conversations").doc(userId).set({
    messages,
  });

  res.send(JSON.stringify(responsePayload));
});
