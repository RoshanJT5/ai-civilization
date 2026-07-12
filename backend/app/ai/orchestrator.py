import json
import logging
from typing import Any

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentActionSchema(BaseModel):
    action_type: str = Field(
        description="One of: TALK, WORK, REST, EXPLORE, INVESTIGATE, OBSERVE"
    )
    target_id: str | None = Field(None, description="Target agent or location ID")
    speech_bubble: str | None = Field(None, description="What the agent says aloud")
    reflection_thought: str | None = Field(
        None, description="Internal thought if reflecting"
    )
    mood_change: int = Field(0, description="Mood change -10 to 10")


class ConversationSchema(BaseModel):
    agent_a_speech: str = Field(description="What Agent A says to initiate the conversation")
    agent_b_reply: str = Field(description="How Agent B replies to Agent A")
    topic: str = Field(description="A short 3-4 word summary of the conversation topic")


class HypothesisSchema(BaseModel):
    title: str = Field(description="Short title of the hypothesis")
    description: str = Field(description="Detailed description connecting observations")
    supporting_memory_ids: list[str] = Field(
        default_factory=list, description="IDs of memories supporting this hypothesis"
    )
    confidence: float = Field(0.0, description="Confidence score 0-1.0")


class ValidationSchema(BaseModel):
    feasible: bool = Field(description="Whether the proposal is technically feasible")
    rationale: str = Field(description="Explanation of the feasibility assessment")
    required_resources: dict[str, int] = Field(
        default_factory=dict,
        description="Resources needed: e.g. {'wood': 10, 'tools': 2}",
    )


class ApprovalSchema(BaseModel):
    approved: bool = Field(description="Whether the proposal is approved")
    notes: str = Field(description="Leadership notes on the decision")


class CognitionOrchestrator:
    def __init__(self):
        self._llm = None
        self._action_parser = PydanticOutputParser(pydantic_object=AgentActionSchema)
        self._hypothesis_parser = PydanticOutputParser(pydantic_object=HypothesisSchema)
        self._validation_parser = PydanticOutputParser(pydantic_object=ValidationSchema)
        self._approval_parser = PydanticOutputParser(pydantic_object=ApprovalSchema)
        self._conversation_parser = PydanticOutputParser(pydantic_object=ConversationSchema)

    def _get_llm(self):
        if self._llm is None and settings.groq_api_key:
            self._llm = ChatGroq(
                api_key=settings.groq_api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.7,
            )
        return self._llm

    def decide_action(
        self, agent_profile: str, context: str, memories: str = ""
    ) -> AgentActionSchema | None:
        llm = self._get_llm()
        if not llm:
            return AgentActionSchema(action_type="REST", speech_bubble=None)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are an AI agent in a simulation. Respond with structured JSON.",
                ),
                ("user", "Agent: {profile}\nContext: {context}\nRecent Memories:\n{memories}\n{format_instructions}"),
            ]
        )

        chain = prompt | llm | self._action_parser
        try:
            return chain.invoke(
                {
                    "profile": agent_profile,
                    "context": context,
                    "memories": memories,
                    "format_instructions": self._action_parser.get_format_instructions(),
                }
            )
        except Exception as e:
            logger.error(f"Decision chain failed: {e}")
            return AgentActionSchema(action_type="REST", speech_bubble=None)

    def generate_hypothesis(
        self, agent_profile: str, memories: str
    ) -> HypothesisSchema | None:
        llm = self._get_llm()
        if not llm:
            return None

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are Aadi, a curious 10-year-old child. Connect observations into hypotheses.",
                ),
                (
                    "user",
                    "Profile: {profile}\nMemories from today:\n{memories}\n{format_instructions}",
                ),
            ]
        )

        chain = prompt | llm | self._hypothesis_parser
        try:
            return chain.invoke(
                {
                    "profile": agent_profile,
                    "memories": memories,
                    "format_instructions": self._hypothesis_parser.get_format_instructions(),
                }
            )
        except Exception as e:
            logger.error(f"Hypothesis chain failed: {e}")
            return None

    def validate_proposal(
        self, expert_profile: str, hypothesis: str, resources: str
    ) -> ValidationSchema | None:
        llm = self._get_llm()
        if not llm:
            return ValidationSchema(
                feasible=True,
                rationale="Auto-approved (LLM unavailable)",
                required_resources={"wood": 10, "tools": 2},
            )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "You are an expert evaluating a proposal's feasibility."),
                (
                    "user",
                    "Expert: {profile}\nProposal: {hypothesis}\nResources: {resources}\n{format_instructions}",
                ),
            ]
        )

        chain = prompt | llm | self._validation_parser
        try:
            return chain.invoke(
                {
                    "profile": expert_profile,
                    "hypothesis": hypothesis,
                    "resources": resources,
                    "format_instructions": self._validation_parser.get_format_instructions(),
                }
            )
        except Exception as e:
            logger.error(f"Validation chain failed: {e}")
            return None

    def approve_proposal(
        self, leader_profile: str, validation: str
    ) -> ApprovalSchema | None:
        llm = self._get_llm()
        if not llm:
            return ApprovalSchema(
                approved=True, notes="Auto-approved (LLM unavailable)"
            )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are Rohan, the settlement leader. Make approval decisions.",
                ),
                (
                    "user",
                    "Leader: {profile}\nValidation Result: {validation}\n{format_instructions}",
                ),
            ]
        )

        chain = prompt | llm | self._approval_parser
        try:
            return chain.invoke(
                {
                    "profile": leader_profile,
                    "validation": validation,
                    "format_instructions": self._approval_parser.get_format_instructions(),
                }
            )
        except Exception as e:
            logger.error(f"Approval chain failed: {e}")
            return None

    def generate_conversation(
        self, agent_a_profile: str, agent_b_profile: str, memories_a: str, memories_b: str
    ) -> ConversationSchema | None:
        llm = self._get_llm()
        if not llm:
            return None

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are writing a brief, in-character comic-book style conversation between two agents in a simulation. Keep it short, fun, and grounded in their memories and personalities. Respond with structured JSON.",
                ),
                (
                    "user",
                    "Agent A: {profile_a}\nAgent A's recent memories:\n{memories_a}\n\nAgent B: {profile_b}\nAgent B's recent memories:\n{memories_b}\n\n{format_instructions}",
                ),
            ]
        )

        chain = prompt | llm | self._conversation_parser
        try:
            return chain.invoke(
                {
                    "profile_a": agent_a_profile,
                    "profile_b": agent_b_profile,
                    "memories_a": memories_a,
                    "memories_b": memories_b,
                    "format_instructions": self._conversation_parser.get_format_instructions(),
                }
            )
        except Exception as e:
            logger.error(f"Conversation chain failed: {e}")
            return None

orchestrator = CognitionOrchestrator()
