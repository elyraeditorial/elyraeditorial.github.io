import { supabase } from "./supabaseClient.js";

/**
 * 💰 STRIPE PAYMENT LINKS (LIVE)
 */
const STRIPE_LINKS = {
  1: "https://buy.stripe.com/bJe00c8Pp2MF22ggZc4sE0f",
  10: "https://buy.stripe.com/9B6aEQd5F5YR9uI7oC4sE09",
  50: "https://buy.stripe.com/28EbIU2r1fzr36k38m4sE0b"
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
 * 🔥 Redirect to Stripe
 */
export function startPaidVote(pack = 1) {
  const amount = Number(pack);

  if (![1, 10, 50].includes(amount)) {
    throw new Error("Invalid vote option.");
  }

  const url = STRIPE_LINKS[amount];

  if (!url) {
    throw new Error(`Payment link not set for $${amount}.`);
  }

  window.location.href = url;
}

/**
 * ✅ Main function used by your page
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
 * Optional UI initializer
 */
export function initVotingUI(contestantId) {
  const voteBtn = document.getElementById("voteBtn");
  const pay10Btn = document.getElementById("pay10");
  const pay50Btn = document.getElementById("pay50");
  const totalVotes = document.getElementById("totalVotes");

  if (voteBtn) {
    voteBtn.onclick = () => startPaidVote(1);
  }

  if (pay10Btn) {
    pay10Btn.onclick = () => startPaidVote(10);
  }

  if (pay50Btn) {
    pay50Btn.onclick = () => startPaidVote(50);
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
