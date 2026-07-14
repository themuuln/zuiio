/// Жүчээний удирдлагын дэлгэц.
///
/// MVP: summary cards + 3 tabs (адуу, баг, нэхэмжлэх).
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/widgets.dart';
import '../application/stable_providers.dart';
import '../domain/boarding_assignment.dart';
import '../domain/stable_invoice.dart';
import '../domain/stable_member.dart';

class StableScreen extends ConsumerWidget {
  const StableScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Жүчээний менежмент'),
          bottom: TabBar(
            onTap: (_) => HapticFeedback.selectionClick(),
            tabs: [
              const Tab(text: 'Адуу', icon: Icon(Icons.pets, size: 18)),
              const Tab(text: 'Баг', icon: Icon(Icons.people, size: 18)),
              const Tab(text: 'Нэхэмжлэх', icon: Icon(Icons.receipt, size: 18)),
            ],
          ),
        ),
        body: Column(
          children: [
            // ── Summary cards ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: SizedBox(
                height: 80,
                child: Row(
                  children: [
                    _SummaryCard(
                      label: 'Байршил',
                      value: '${ref.watch(activeBoardersCountProvider)}',
                      icon: Icons.pets,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    _SummaryCard(
                      label: 'Багийнхан',
                      value: '${ref.watch(teamMemberCountProvider)}',
                      icon: Icons.people,
                      color: theme.colorScheme.tertiary,
                    ),
                    const SizedBox(width: 8),
                    _SummaryCard(
                      label: 'Төлбөр',
                      value: '${ref.watch(unpaidInvoicesCountProvider)}',
                      icon: Icons.receipt,
                      color: theme.colorScheme.error,
                    ),
                  ],
                ),
              ),
            ),

            // ── Tab content ──
            Expanded(
              child: TabBarView(
                children: [_BoardingsTab(), _MembersTab(), _InvoicesTab()],
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            // TODO: Add new item based on current tab
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

// ── Summary Card ──────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(label, style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Boardings Tab ─────────────────────────────────────────────────────

class _BoardingsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncAssignments = ref.watch(stableAssignmentsProvider);

    return asyncAssignments.when(
      data: (assignments) {
        if (assignments.isEmpty) {
          return const EmptyState(
            icon: Icons.pets,
            title: 'Байршиж буй адуу байхгүй',
            description: 'Жүчээнд байршиж буй адуу байхгүй байна.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: assignments.length,
          itemBuilder: (context, index) {
            final a = assignments[index];
            return _AssignmentTile(assignment: a);
          },
        );
      },
      loading: () => SkeletonLoader(
        items: 4,
        itemBuilder: (ctx, i) => const SkeletonListTile(),
      ),
      error: (err, _) => TamgaErrorWidget(
        message: 'Байршил ачаалахад алдаа гарлаа',
        onRetry: () => {},
      ),
    );
  }
}

class _AssignmentTile extends StatelessWidget {
  const _AssignmentTile({required this.assignment});

  final BoardingAssignment assignment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = switch (assignment.status) {
      BoardingStatus.active => Colors.green,
      BoardingStatus.paused => Colors.orange,
      BoardingStatus.ended => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Icon(Icons.pets, size: 20, color: statusColor),
        ),
        title: Text(
          assignment.horseName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(assignment.ownerName),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                assignment.statusLabel,
                style: TextStyle(fontSize: 11, color: statusColor),
              ),
            ),
            if (assignment.monthlyFee > 0)
              Text(
                '₮${_format(assignment.monthlyFee)}/сар',
                style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
              ),
          ],
        ),
        onTap: () {
          // TODO: Edit assignment detail
        },
      ),
    );
  }
}

// ── Members Tab ───────────────────────────────────────────────────────

class _MembersTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncMembers = ref.watch(stableMembersProvider);

    return asyncMembers.when(
      data: (members) {
        // Sort: owners first, then staff, then clients
        final sorted = [...members]
          ..sort((a, b) => a.role.index.compareTo(b.role.index));

        if (sorted.isEmpty) {
          return const EmptyState(
            icon: Icons.people,
            title: 'Багийн гишүүн байхгүй',
            description: 'Жүчээний багт гишүүн байхгүй байна.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: sorted.length,
          itemBuilder: (context, index) {
            final m = sorted[index];
            return _MemberTile(member: m);
          },
        );
      },
      loading: () => SkeletonLoader(
        items: 4,
        itemBuilder: (ctx, i) => const SkeletonListTile(),
      ),
      error: (err, _) => TamgaErrorWidget(
        message: 'Багийн мэдээлэл ачаалахад алдаа гарлаа',
        onRetry: () => {},
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({required this.member});

  final StableMember member;

  @override
  Widget build(BuildContext context) {
    final roleColor = switch (member.role) {
      StableRole.owner => Colors.amber,
      StableRole.staff => Colors.blue,
      StableRole.client => Colors.green,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: roleColor.withValues(alpha: 0.15),
          child: Icon(
            switch (member.role) {
              StableRole.owner => Icons.star,
              StableRole.staff => Icons.person,
              StableRole.client => Icons.person_outline,
            },
            size: 20,
            color: roleColor,
          ),
        ),
        title: Text(
          member.displayName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(member.roleLabel),
        trailing: Text(
          member.phone,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        onTap: () {
          // TODO: Edit member detail
        },
      ),
    );
  }
}

// ── Invoices Tab ──────────────────────────────────────────────────────

class _InvoicesTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncInvoices = ref.watch(stableInvoicesProvider);

    return asyncInvoices.when(
      data: (invoices) {
        // Sort: unpaid first
        final sorted = [...invoices]
          ..sort((a, b) => a.status.index.compareTo(b.status.index));

        if (sorted.isEmpty) {
          return const EmptyState(
            icon: Icons.receipt,
            title: 'Нэхэмжлэх байхгүй',
            description: 'Төлбөрийн нэхэмжлэх байхгүй байна.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: sorted.length,
          itemBuilder: (context, index) {
            final inv = sorted[index];
            return _InvoiceTile(invoice: inv);
          },
        );
      },
      loading: () => SkeletonLoader(
        items: 4,
        itemBuilder: (ctx, i) => const SkeletonListTile(),
      ),
      error: (err, _) => TamgaErrorWidget(
        message: 'Нэхэмжлэх ачаалахад алдаа гарлаа',
        onRetry: () => {},
      ),
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  const _InvoiceTile({required this.invoice});

  final StableInvoice invoice;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = switch (invoice.status) {
      InvoiceStatus.unpaid => theme.colorScheme.error,
      InvoiceStatus.partial => Colors.orange,
      InvoiceStatus.paid => Colors.green,
      InvoiceStatus.cancelled => Colors.grey,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Icon(
            switch (invoice.status) {
              InvoiceStatus.unpaid => Icons.schedule,
              InvoiceStatus.partial => Icons.payment,
              InvoiceStatus.paid => Icons.check_circle,
              InvoiceStatus.cancelled => Icons.cancel,
            },
            size: 20,
            color: statusColor,
          ),
        ),
        title: Text(
          invoice.clientName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${invoice.issuedAt.toLocal().toString().split(' ')[0]} · '
          '${invoice.lineItems.length} ширхэг',
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '₮${_format(invoice.totalAmount)}',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                invoice.statusLabel,
                style: TextStyle(fontSize: 11, color: statusColor),
              ),
            ),
          ],
        ),
        onTap: () {
          // TODO: Show invoice detail
        },
      ),
    );
  }
}

// ── Shared ────────────────────────────────────────────────────────────

String _format(int amount) {
  return amount.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
}
