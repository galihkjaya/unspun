"""Shared response contracts. Serialized to camelCase to match app/lib/types.ts."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    # snake_case in Python, camelCase on the wire.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class QuarantinedDomain(CamelModel):
    domain: str
    reason: str


class RedditLink(CamelModel):
    subreddit: str
    url: str


class Recommendation(CamelModel):
    rank: int
    name: str
    mentions: int
    sentiment: Literal["positive", "mixed", "negative"]
    community_quote: str
    caveat: str
    price: float
    buy_url: str
    thumbnail: str = ""
    reddit_links: list[RedditLink] = []


class SearchResult(CamelModel):
    query: str
    summary: str
    quarantined: list[QuarantinedDomain]
    recommendations: list[Recommendation]
    savings: float
    astroturf_flags: list[str]
    timestamp: str


class SearchRequest(CamelModel):
    query: str = Field(min_length=2, max_length=200)
