import logging
import time
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from supermemory import Supermemory as SupermemorySDK

    _sdk_available = True
except ImportError:
    _sdk_available = False
    SupermemorySDK = None


class SupermemoryClient:
    def __init__(self):
        self._client = None
        self._fallback_store: dict[str, list[dict]] = {}

    def _ensure_client(self):
        if self._client is None and _sdk_available and settings.supermemory_api_key:
            self._client = SupermemorySDK(api_key=settings.supermemory_api_key)
        return self._client is not None

    def add_memory(
        self, agent_id: str, content: str, metadata: dict | None = None
    ) -> str | None:
        container_tag = f"agent_{agent_id}"
        return self._add(content, container_tag, metadata)

    def add_public_knowledge(
        self, content: str, metadata: dict | None = None
    ) -> str | None:
        return self._add(content, "public_library", metadata)

    def add_world_event(self, content: str, metadata: dict | None = None) -> str | None:
        return self._add(content, "world_state", metadata)

    def _add(
        self, content: str, container_tag: str, metadata: dict | None = None
    ) -> str | None:
        if self._ensure_client():
            try:
                result = self._client.add(
                    content=content,
                    container_tags=[container_tag],
                )
                doc_id = result.id
                logger.info(f"Supermemory add OK: tag={container_tag} id={doc_id}")
                return doc_id
            except Exception as e:
                logger.warning(f"Supermemory add failed: {e}. Using fallback.")

        return self._fallback_add(content, container_tag)

    def search_memories(
        self, agent_id: str, query: str, top_k: int = 5
    ) -> list[dict[str, Any]]:
        container_tag = f"agent_{agent_id}"
        results = self._search(query, container_tag, top_k)
        public_results = self._search(query, "public_library", top_k)
        merged = results + public_results
        merged.sort(key=lambda x: x.get("score", 0), reverse=True)
        return merged[:top_k]

    def _search(
        self, query: str, container_tag: str, top_k: int = 5
    ) -> list[dict[str, Any]]:
        if self._ensure_client():
            try:
                response = self._client.search.documents(
                    q=query,
                    container_tags=[container_tag],
                )
                return [
                    {
                        "id": r.document_id,
                        "content": r.content or r.title or "",
                        "score": r.score,
                        "container_tag": container_tag,
                    }
                    for r in (response.results or [])
                ][:top_k]
            except Exception as e:
                logger.warning(f"Supermemory search failed: {e}. Using fallback.")

        return self._fallback_search(query, container_tag, top_k)

    def _fallback_add(self, content: str, container_tag: str) -> str:
        doc_id = f"fallback_{int(time.time())}_{hash(content) % 10000}"
        if container_tag not in self._fallback_store:
            self._fallback_store[container_tag] = []
        self._fallback_store[container_tag].append(
            {
                "id": doc_id,
                "content": content,
                "timestamp": time.time(),
            }
        )
        return doc_id

    def _fallback_search(
        self, query: str, container_tag: str, top_k: int
    ) -> list[dict[str, Any]]:
        query_lower = query.lower()
        results = []
        for doc in self._fallback_store.get(container_tag, []):
            if query_lower in doc["content"].lower():
                results.append(
                    {
                        "id": doc["id"],
                        "content": doc["content"],
                        "score": 0.5,
                        "container_tag": container_tag,
                    }
                )
        return results[:top_k]


supermemory = SupermemoryClient()
