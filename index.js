import { config } from "dotenv";
import OpenAI from "openai";

config();

const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

function createReservation(nickname, todaysAge) {}
function cancelReservation(id) {}

async function runConversation() {
  // Step 1: send the conversation and available functions to GPT
  const messages = [
    {
      role: "system",
      content: `당신은 '도킹'이라는 헌팅포차(또는 Matchmaking 술집)의 예약 관리 챗봇이에요.

      기능:
        1. 예약
        "닉네임"과 "오늘의 나이"를 입력해주세요! (실제 이름과 나이가 아니어도 돼요)
        입력 정보 확인 후, 예약 처리 진행합니다.

        2.예약 취소
        예약 번호를 알려주세요.
        번호 확인 후, 예약 취소를 진행합니다.
      
      주의사항:
      사용자(user)로부터의 정보는 오타 혹은 잘못 이해 할 가능성이 있기 때문에 꼭 재확인해야 합니다. (이 과정은 모든 기능에서 필수 입니다.)
      정보 재 확인 시에는, 교정을 요청한 정보만 정정하세요.
      함수에서 에러가 발생하면 사용자에게 알려주세요.
      20대의 말투로 대화해주세요!
      가독성을 위해 적절한 이모지를 사용해주세요.
`,
    },
    { role: "user", content: "안녕?" },
  ];
  const functions = [
    {
      name: "create_reservation",
      description: "새로운 예약을 생성합니다.",
      parameters: {
        type: "object",
        properties: {
          nickname: {
            type: "string",
            description: "닉네임 혹은 이름",
          },
          todaysAge: { type: "number", description: "오늘의 나이" },
        },
        required: ["nickname", "todaysAge"],
      },
    },
    {
      name: "cancel_reservation",
      description: "예약을 취소합니다.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "예약 번호",
          },
        },
        required: ["id"],
      },
    },
  ];

  let response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: functions,
    function_call: "auto",
  });

  let responseMessage = response.choices[0].message;

  messages.push(responseMessage);
  console.log(responseMessage);

  let newMessage = { role: "user", content: "예약할래" };
  messages.push(newMessage);
  console.log(newMessage);

  response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: functions,
    function_call: "auto",
  });

  responseMessage = response.choices[0].message;
  messages.push(responseMessage);
  console.log(responseMessage);

  newMessage = { role: "user", content: "일부러 알아듣기 힘들게 여러가지 미사어구를 잔뜩 집어 넣었지만 결론적으로 내 이름은 정로이구 나이는 28살이야" };
  messages.push(newMessage);
  console.log(newMessage);
  response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: functions,
    function_call: "auto",
  });
  responseMessage = response.choices[0].message;
  console.log(responseMessage);

  newMessage = { role: "user", content: "틀렸어 이름은 정로야" };
  messages.push(newMessage);
  console.log(newMessage);
  response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: functions,
    function_call: "auto",
  });
  responseMessage = response.choices[0].message;
  console.log(responseMessage);

  newMessage = { role: "user", content: "맞아" };
  messages.push(newMessage);
  console.log(newMessage);
  response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: functions,
    function_call: "auto",
  });
  responseMessage = response.choices[0].message;
  console.log(responseMessage);

  if (responseMessage.function_call) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    const availableFunctions = {
      create_reservation: createReservation,
      cancel_reservation: cancelReservation,
    }; // only one function in this example, but you can have multiple
    const functionName = responseMessage.function_call.name;
    const functionToCall = availableFunctions[functionName];
    const functionArgs = JSON.parse(responseMessage.function_call.arguments);
    const functionResponse = functionToCall(
      functionArgs.location,
      functionArgs.unit
    );

    // Step 4: send the info on the function call and function response to GPT
    messages.push(responseMessage); // extend conversation with assistant's reply
    messages.push({
      role: "function",
      name: functionName,
      content: functionResponse,
    }); // extend conversation with function response
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    }); // get a new response from GPT where it can see the function response
    return secondResponse;
  }
}

const response = await runConversation();
console.log("done!");
