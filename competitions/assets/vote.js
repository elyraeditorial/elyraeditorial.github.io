import { supabase } from "./supabaseClient.js";

/**
 * 🔥 STRIPE LINKS
 */
const STRIPE_LINKS = {
  1: "https://buy.stripe.com/bJe00c8Pp2MF22ggZc4sE0f",
  10: "https://buy.stripe.com/YOUR_10_LINK",
  50: "https://buy.stripe.com/YOUR_50_LINK"
};

/**
 * 🚫 FREE VOTE REMOVED COMPLETELY
 * 🚫 LOGIN REMOVED COMPLETELY
 */

/**
 * Fetch vote totals
 */
export async function fetchLatestContestantTotals(contestantId) {
  if (!contestantId) throw new Error("Contestant missing.");

  const { data, error } = await supabase
    .from("contestant_vote_totals")
    .select("total_votes")
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (error) throw error;

  return data || { total_votes: 0 };
}

/**
 * 💰 Paid vote (Stripe redirect)
 */
export function startPaidVote(pack = 1) {
  if (![1, 10, 50].includes(Number(pack))) {
    alert("Invalid vote option.");
    return;
  }

  const url = STRIPE_LINKS[pack];

  if (!url) {
    alert("Payment link not set.");
    return;
  }

  window.location.href = url;
}

/**
 * 🚀 MAIN BUTTON HANDLER
 * This auto-connects buttons on page
 */
export function initVotingUI(contestantId) {
  const voteBtn = document.getElementById("voteBtn");
  const buy10Btn = document.getElementById("buy10Btn");
  const buy50Btn = document.getElementById("buy50Btn");
  const totalVotes = document.getElementById("totalVotes");

  // 🔥 $1 MAIN VOTE
  if (voteBtn) {
    voteBtn.onclick = () => startPaidVote(1);
  }

  // 🔥 $10
  if (buy10Btn) {
    buy10Btn.onclick = () => startPaidVote(10);
  }

  // 🔥 $50
  if (buy50Btn) {
    buy50Btn.onclick = () => startPaidVote(50);
  }

  // 🔄 Load vote count
  if (totalVotes && contestantId) {
    fetchLatestContestantTotals(contestantId)
      .then(res => {
        totalVotes.textContent = `Total votes: ${res.total_votes}`;
      })
      .catch(() => {
        totalVotes.textContent = "Total votes: —";
      });
  }
}
