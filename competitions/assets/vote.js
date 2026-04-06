import { supabase } from "./supabaseClient.js";

/**
 * Stripe payment links
 */
const STRIPE_LINKS = {
  1: "https://buy.stripe.com/bJe00c8Pp2MF22ggZc4sE0f",
  10: "https://buy.stripe.com/YOUR_10_LINK",
  50: "https://buy.stripe.com/YOUR_50_LINK"
};

/**
 * Fetch vote totals
 */
export async function fetchLatestContestantTotals(contestantId) {
  if (!contestantId) throw new Error("Contestant missing.");

  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("total_votes, paid_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;

  return data || { total_votes: 0, paid_votes: 0 };
}

/**
 * Simple paid redirect by amount
 */
export function startPaidVote(pack = 1) {
  const amount = Number(pack);

  if (![1, 10, 50].includes(amount)) {
    throw new Error("Invalid vote option.");
  }

  const url = STRIPE_LINKS[amount];

  if (!url || url.includes("YOUR_")) {
    throw new Error(`Payment link not set for $${amount}.`);
  }

  window.location.href = url;
}

/**
 * Compatibility function for contestant.html
 * Accepts the object payload your page is already sending
 */
export async function startPaidVoteCheckout({
  contestId,
  contestantId,
  pack = 1
} = {}) {
  if (!contestId) throw new Error("Contest not ready yet.");
  if (!contestantId) throw new Error("Contestant not ready yet.");

  startPaidVote(pack);
}

/**
 * Optional helper if used elsewhere
 */
export function initVotingUI(contestantId) {
  const voteBtn = document.getElementById("voteBtn");
  const pay10Btn = document.getElementById("pay10") || document.getElementById("buy10Btn");
  const pay50Btn = document.getElementById("pay50") || document.getElementById("buy50Btn");
  const totalVotes = document.getElementById("totalVotes");

  if (voteBtn) {
    voteBtn.onclick = async () => {
      try {
        await startPaidVoteCheckout({
          contestId: "direct",
          contestantId: contestantId || "direct",
          pack: 1
        });
      } catch (err) {
        alert(err.message || "Checkout failed.");
      }
    };
  }

  if (pay10Btn) {
    pay10Btn.onclick = async () => {
      try {
        await startPaidVoteCheckout({
          contestId: "direct",
          contestantId: contestantId || "direct",
          pack: 10
        });
      } catch (err) {
        alert(err.message || "Checkout failed.");
      }
    };
  }

  if (pay50Btn) {
    pay50Btn.onclick = async () => {
      try {
        await startPaidVoteCheckout({
          contestId: "direct",
          contestantId: contestantId || "direct",
          pack: 50
        });
      } catch (err) {
        alert(err.message || "Checkout failed.");
      }
    };
  }

  if (totalVotes && contestantId) {
    fetchLatestContestantTotals(contestantId)
      .then(res => {
        totalVotes.textContent = `Total votes: ${Number(res.total_votes || 0).toLocaleString()}`;
      })
      .catch(() => {
        totalVotes.textContent = "Total votes: —";
      });
  }
}
