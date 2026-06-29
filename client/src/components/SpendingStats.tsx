import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { expenseService } from "../services/expense";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CATEGORY_LABELS: Record<string, string> = {
  food: "🍕 Food",
  transport: "🚗 Transport",
  shopping: "🛍️ Shopping",
  entertainment: "🎬 Entertainment",
  utilities: "💡 Utilities",
  rent: "🏠 Rent",
  healthcare: "🏥 Healthcare",
  other: "📋 Other",
};

const CATEGORY_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#7BC67E",
];

interface SpendingStatsData {
  categoryBreakdown: Record<string, number>;
  monthlyBreakdown: Record<string, number>;
  groupBreakdown: { name: string; amount: number }[];
  totalSpent: number;
  expenseCount: number;
}

export default function SpendingStats() {
  const [stats, setStats] = useState<SpendingStatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await expenseService.getSpendingStats();
        if (resp.success) {
          setStats(resp.stats);
        }
      } catch (error) {
        console.log("error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats || stats.expenseCount === 0) {
    return null;
  }

  // Pie chart data — spending by category
  const categoryEntries = Object.entries(stats.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const pieData = {
    labels: categoryEntries.map(([cat]) => CATEGORY_LABELS[cat] || cat),
    datasets: [
      {
        data: categoryEntries.map(([, amount]) => amount),
        backgroundColor: CATEGORY_COLORS.slice(0, categoryEntries.length),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 11 }, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw;
            const percentage = ((value / stats.totalSpent) * 100).toFixed(1);
            return `₹${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Bar chart data — spending by month
  const monthLabels = Object.keys(stats.monthlyBreakdown).map((key) => {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  });

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Spending (₹)",
        data: Object.values(stats.monthlyBreakdown),
        backgroundColor: "#4687ff",
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Spending Statistics
      </Typography>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: "#f3e5f5" }}>
            <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Total Spent</Typography>
              <Typography variant="h6" fontWeight="bold" color="#7b1fa2">
                ₹{stats.totalSpent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: "#e8eaf6" }}>
            <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Expenses</Typography>
              <Typography variant="h6" fontWeight="bold" color="#283593">
                {stats.expenseCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        {/* Pie Chart - Category Breakdown */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
                By Category
              </Typography>
              <Box sx={{ maxWidth: 250, mx: "auto" }}>
                <Pie data={pieData} options={pieOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bar Chart - Monthly Spending */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
                Monthly Spending (Last 6 months)
              </Typography>
              <Bar data={barData} options={barOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Group breakdown */}
      {stats.groupBreakdown.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              By Group
            </Typography>
            {stats.groupBreakdown
              .sort((a, b) => b.amount - a.amount)
              .map((g) => (
                <Box
                  key={g.name}
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5 }}
                >
                  <Typography variant="body2">{g.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">₹{g.amount.toFixed(2)}</Typography>
                </Box>
              ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
