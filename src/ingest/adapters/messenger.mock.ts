export interface MockMessengerMessage {
  id: string;
  speaker: "self" | "other";
  timestamp: string;
  text: string;
}

export interface MockMessengerArtifact {
  artifactId: string;
  sourceType: "messenger";
  channel: "kakao";
  roomId: string;
  title: string;
  messages: MockMessengerMessage[];
}

export const messengerMockArtifact: MockMessengerArtifact = {
  artifactId: "artifact_kakao_mock_01",
  sourceType: "messenger",
  channel: "kakao",
  roomId: "room_open_source_talk",
  title: "Open Source Talk",
  messages: [
    {
      id: "msg_1",
      speaker: "self",
      timestamp: "2026-03-20T10:00:00+09:00",
      text: "나는 뭔가 제품보다는 오픈소스 쪽이 더 재밌는 것 같아."
    },
    {
      id: "msg_2",
      speaker: "other",
      timestamp: "2026-03-20T10:00:12+09:00",
      text: "왜 그렇게 느끼는데?"
    },
    {
      id: "msg_3",
      speaker: "self",
      timestamp: "2026-03-20T10:01:10+09:00",
      text: "구조를 더 깔끔하게 잡을 수 있고 내가 통제하는 느낌이 커."
    },
    {
      id: "msg_4",
      speaker: "self",
      timestamp: "2026-03-20T10:02:00+09:00",
      text: "설명할 때도 장황하게 늘어놓기보다 핵심부터 말하는 편이 편해."
    }
  ]
};
