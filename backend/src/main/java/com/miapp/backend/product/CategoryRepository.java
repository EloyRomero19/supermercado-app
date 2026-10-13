package com.miapp.backend.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface CategoryRepository extends JpaRepository<Category, Short> {

	List<Category> findAllByOrderBySortOrder();

}
